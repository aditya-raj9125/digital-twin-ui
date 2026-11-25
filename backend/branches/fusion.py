"""3-Branch Attention-Weighted Fusion Layer (Doc.md Sections 2 & 5).

Combines spatial feature maps from:
  - Branch 1: PhysicsInformedBranch (B, C1, H, W)
  - Branch 2: Spatiotemporal ClimateDualNet context (B, C2, H, W)
  - Branch 3: HierarchicalTrendBranch (B, C3, H, W)

Uses per-branch projection + spatial-channel attention gating to produce
fused features (B, out_channels, H, W) and optional point + uncertainty heads.

Note: Standalone module — not wired into Phase 1 ClimateDualNet, backend, or UI.
"""

from __future__ import annotations

from typing import Dict, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F


class MultiBranchFusion(nn.Module):
    """Attention-weighted fusion of Physics, Spatiotemporal, and Trend branches."""

    def __init__(
        self,
        physics_ch: int = 64,
        spatiotemporal_ch: int = 32,
        trend_ch: int = 64,
        fused_ch: int = 64,
        forecast_len: int = 7,
        n_groups: int = 8,
    ) -> None:
        super().__init__()
        self.fused_ch = fused_ch
        self.forecast_len = forecast_len

        # Align all 3 branches to a common channel dimension
        self.proj_physics = nn.Sequential(
            nn.Conv2d(physics_ch, fused_ch, kernel_size=1, bias=False),
            nn.GroupNorm(n_groups, fused_ch),
            nn.SiLU(inplace=True),
        )
        self.proj_spatiotemporal = nn.Sequential(
            nn.Conv2d(spatiotemporal_ch, fused_ch, kernel_size=1, bias=False),
            nn.GroupNorm(n_groups, fused_ch),
            nn.SiLU(inplace=True),
        )
        self.proj_trend = nn.Sequential(
            nn.Conv2d(trend_ch, fused_ch, kernel_size=1, bias=False),
            nn.GroupNorm(n_groups, fused_ch),
            nn.SiLU(inplace=True),
        )

        # Spatial attention-weighting across the 3 aligned branches -> softmax weights (B, 3, H, W)
        self.gate_net = nn.Sequential(
            nn.Conv2d(fused_ch * 3, fused_ch, kernel_size=3, padding=1, bias=False),
            nn.GroupNorm(n_groups, fused_ch),
            nn.SiLU(inplace=True),
            nn.Conv2d(fused_ch, 3, kernel_size=1),
        )

        # Residual refinement after weighted merge
        self.refine = nn.Sequential(
            nn.Conv2d(fused_ch, fused_ch, kernel_size=3, padding=1, bias=False),
            nn.GroupNorm(n_groups, fused_ch),
            nn.SiLU(inplace=True),
        )

        # Dual-output prediction heads (point forecast + uncertainty half-width)
        self.head_rain = self._make_dual_head(fused_ch, forecast_len)
        self.head_tmax = self._make_dual_head(fused_ch, forecast_len)
        self.head_tmin = self._make_dual_head(fused_ch, forecast_len)

    @staticmethod
    def _make_dual_head(in_ch: int, forecast_len: int) -> nn.Module:
        return nn.Sequential(
            nn.Conv2d(in_ch, in_ch, kernel_size=3, padding=1),
            nn.SiLU(inplace=True),
            nn.Conv2d(in_ch, forecast_len * 2, kernel_size=1),  # [point, log_std]
        )

    def fuse_features(
        self,
        f_physics: torch.Tensor,
        f_spatiotemporal: torch.Tensor,
        f_trend: torch.Tensor,
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """Fuse the 3 branch feature maps via spatial softmax attention.

        Returns
        -------
        fused   : (B, fused_ch, H, W)
        weights : (B, 3, H, W) interpretable per-branch spatial attention weights
        """
        p1 = self.proj_physics(f_physics)
        p2 = self.proj_spatiotemporal(f_spatiotemporal)
        p3 = self.proj_trend(f_trend)

        concat = torch.cat([p1, p2, p3], dim=1)  # (B, 3 * fused_ch, H, W)
        weights = torch.softmax(self.gate_net(concat), dim=1)  # (B, 3, H, W)

        merged = (
            weights[:, 0:1] * p1
            + weights[:, 1:2] * p2
            + weights[:, 2:3] * p3
        )
        fused = merged + self.refine(merged)
        return fused, weights

    def forward(
        self,
        f_physics: torch.Tensor,
        f_spatiotemporal: torch.Tensor,
        f_trend: torch.Tensor,
    ) -> Dict[str, torch.Tensor]:
        """Produce fused point forecasts, uncertainty bounds, and branch weights."""
        fused, weights = self.fuse_features(f_physics, f_spatiotemporal, f_trend)

        def split_head(raw: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
            point, raw_scale = raw.chunk(2, dim=1)
            uncertainty = F.softplus(raw_scale) + 1e-4  # positive std / half-width
            return point, uncertainty

        rain_pt, rain_unc = split_head(self.head_rain(fused))
        tmax_pt, tmax_unc = split_head(self.head_tmax(fused))
        tmin_pt, tmin_unc = split_head(self.head_tmin(fused))

        point_forecast = torch.stack([rain_pt, tmax_pt, tmin_pt], dim=2)  # (B, T, 3, H, W)
        uncertainty = torch.stack([rain_unc, tmax_unc, tmin_unc], dim=2)  # (B, T, 3, H, W)

        return {
            "forecast": point_forecast,
            "uncertainty": uncertainty,
            "branch_weights": weights,
            "fused_features": fused,
        }
