"""Branch 3: Hierarchical Seasonal-Trend Module.

Models slower-moving weekly/seasonal aggregate statistics and climatological
anomalies to guard against long-horizon forecast drift (Doc.md Sections 2, 5, 10).

Note: Standalone module — not wired into Phase 1 ClimateDualNet or inference.
"""

from __future__ import annotations

from typing import Optional, Tuple

import torch
import torch.nn as nn


class HierarchicalTrendBranch(nn.Module):
    """Multi-scale temporal trend & seasonal conditioning branch."""

    def __init__(
        self,
        in_channels: int = 3,
        forecast_len: int = 7,
        hidden_dim: int = 64,
        out_spatial_channels: int = 64,
        n_groups: int = 8,
    ) -> None:
        super().__init__()
        self.in_channels = in_channels
        self.forecast_len = forecast_len
        self.hidden_dim = hidden_dim

        # Domain-level multi-scale summary per timestep:
        # spatial mean + spatial std per channel (2 * in_channels) + 2 calendar sin/cos
        step_dim = 2 * in_channels + 2
        self.temporal_gru = nn.GRU(
            input_size=step_dim,
            hidden_size=hidden_dim,
            num_layers=2,
            batch_first=True,
            dropout=0.1,
        )

        # Predicts 7-day regional aggregate statistics (B, forecast_len, in_channels)
        self.aggregate_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.SiLU(inplace=True),
            nn.Linear(hidden_dim, forecast_len * in_channels),
        )

        # Projects temporal trend state + slow spatial rolling mean into a spatial map
        self.spatial_proj = nn.Sequential(
            nn.Conv2d(in_channels * 2 + hidden_dim, out_spatial_channels, 3, padding=1, bias=False),
            nn.GroupNorm(n_groups, out_spatial_channels),
            nn.SiLU(inplace=True),
        )

    def forward(
        self,
        x: torch.Tensor,
        mask: Optional[torch.Tensor] = None,
        doy_sincos: Optional[torch.Tensor] = None,
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """Compute hierarchical trend conditioning map and regional aggregate forecast.

        Parameters
        ----------
        x          : (B, T_in, C, H, W) input history tensor
        mask       : Optional (H, W) bool land validity mask
        doy_sincos : Optional (B, T_in, 2) day-of-year [sin, cos] calendar features

        Returns
        -------
        trend_map      : (B, out_spatial_channels, H, W) spatial conditioning features
        aggregate_pred : (B, forecast_len, C) predicted domain-mean trajectory
        """
        B, T, C, H, W = x.shape
        device = x.device
        dtype = x.dtype

        if mask is not None:
            m = mask.to(device=device, dtype=dtype).view(1, 1, 1, H, W)
            denom = torch.clamp(m.sum(dim=(-2, -1)), min=1.0)
            spatial_mean = (x * m).sum(dim=(-2, -1)) / denom  # (B, T, C)
            var = ((x - spatial_mean.unsqueeze(-1).unsqueeze(-1)) ** 2 * m).sum(
                dim=(-2, -1)
            ) / denom
            spatial_std = torch.sqrt(torch.clamp(var, min=1e-6))
        else:
            spatial_mean = x.mean(dim=(-2, -1))  # (B, T, C)
            spatial_std = x.std(dim=(-2, -1), unbiased=False)

        if doy_sincos is None:
            doy_sincos = torch.zeros(B, T, 2, device=device, dtype=dtype)

        seq_feats = torch.cat([spatial_mean, spatial_std, doy_sincos], dim=-1)
        gru_out, _ = self.temporal_gru(seq_feats)  # (B, T, hidden_dim)
        trend_vec = gru_out[:, -1]  # (B, hidden_dim)

        aggregate_pred = self.aggregate_head(trend_vec).view(B, self.forecast_len, C)

        # Combine slow 30-day & recent 7-day spatial averages with broadcast trend state
        slow_avg = x.mean(dim=1)  # (B, C, H, W)
        fast_avg = x[:, -min(7, T) :].mean(dim=1)  # (B, C, H, W)
        trend_grid = trend_vec.view(B, self.hidden_dim, 1, 1).expand(B, self.hidden_dim, H, W)

        trend_map = self.spatial_proj(
            torch.cat([slow_avg, fast_avg, trend_grid], dim=1)
        )
        return trend_map, aggregate_pred
