"""Branch 1: Physics-Informed Module & Auxiliary Physical Constraint Losses.

Implements soft meteorological constraints from Doc.md (Sections 2, 5, 10):
- Clausius-Clapeyron saturation vapor pressure & moisture-temperature scaling
- Diurnal Temperature Range (DTR = Tmax - Tmin) energy-balance consistency
- Non-negativity & thermodynamic bounds over masked land cells

Note: Standalone module — not wired into Phase 1 ClimateDualNet or inference.
"""

from __future__ import annotations

from typing import Dict, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F


def compute_saturation_vapor_pressure(temp_c: torch.Tensor) -> torch.Tensor:
    """Tetens formula for saturation vapor pressure e_s (kPa) from temperature (°C)."""
    t_safe = torch.clamp(temp_c, min=-40.0, max=55.0)
    return 0.6108 * torch.exp((17.27 * t_safe) / (t_safe + 237.3))


class PhysicsInformedBranch(nn.Module):
    """Encodes derived physical fields from (rain, tmax, tmin) into spatial features."""

    def __init__(self, out_channels: int = 64, n_groups: int = 8) -> None:
        super().__init__()
        # Derived physical channels (6):
        # [dtr, t_mean, e_s(t_mean), rain_per_es, d_tmax_dt, d_rain_dt]
        in_phys_ch = 6

        self.encoder = nn.Sequential(
            nn.Conv2d(in_phys_ch, 32, kernel_size=3, padding=1, bias=False),
            nn.GroupNorm(n_groups, 32),
            nn.SiLU(inplace=True),
            nn.Conv2d(32, out_channels, kernel_size=3, padding=1, bias=False),
            nn.GroupNorm(n_groups, out_channels),
            nn.SiLU(inplace=True),
        )

    def _extract_physical_fields(self, x_phys: torch.Tensor) -> torch.Tensor:
        """Compute physical diagnostic fields from the latest window frames.

        Parameters
        ----------
        x_phys : (B, T, 3, H, W) in physical units [rain (mm), tmax (°C), tmin (°C)]

        Returns
        -------
        phys_feats : (B, 6, H, W)
        """
        last = x_phys[:, -1]  # (B, 3, H, W)
        rain = torch.clamp(last[:, 0], min=0.0)
        tmax = last[:, 1]
        tmin = last[:, 2]

        dtr = tmax - tmin
        t_mean = 0.5 * (tmax + tmin)
        e_s = compute_saturation_vapor_pressure(t_mean)
        rain_es_ratio = rain / (e_s + 1e-4)

        if x_phys.shape[1] >= 2:
            prev = x_phys[:, -2]
            d_tmax_dt = tmax - prev[:, 1]
            d_rain_dt = rain - torch.clamp(prev[:, 0], min=0.0)
        else:
            d_tmax_dt = torch.zeros_like(tmax)
            d_rain_dt = torch.zeros_like(rain)

        return torch.stack(
            [dtr, t_mean, e_s, rain_es_ratio, d_tmax_dt, d_rain_dt], dim=1
        )

    def forward(self, x_phys: torch.Tensor) -> torch.Tensor:
        """Return spatial physics-conditioning features (B, out_channels, H, W)."""
        phys_fields = self._extract_physical_fields(x_phys)
        return self.encoder(phys_fields)


class PhysicsInformedLoss(nn.Module):
    """Soft physical constraint losses computed over valid land grid cells."""

    def __init__(
        self,
        w_dtr_order: float = 1.0,
        w_dtr_rain_coupling: float = 0.2,
        w_cc_scaling: float = 0.15,
        w_rain_nonneg: float = 1.0,
        cc_rate_per_kelvin: float = 0.07,
    ) -> None:
        super().__init__()
        self.w_dtr_order = w_dtr_order
        self.w_dtr_rain_coupling = w_dtr_rain_coupling
        self.w_cc_scaling = w_cc_scaling
        self.w_rain_nonneg = w_rain_nonneg
        self.cc_rate_per_kelvin = cc_rate_per_kelvin

    @staticmethod
    def _masked_mean(loss_map: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        # mask: (H, W) or (B, 1, H, W) -> broadcast to loss_map (B, T, H, W)
        while mask.ndim < loss_map.ndim:
            mask = mask.unsqueeze(0)
        mask_f = mask.to(dtype=loss_map.dtype, device=loss_map.device)
        denom = mask_f.sum() * (loss_map.numel() / max(mask_f.numel(), 1))
        return (loss_map * mask_f).sum() / torch.clamp(denom, min=1.0)

    def forward(
        self,
        pred_phys: torch.Tensor,
        target_phys: torch.Tensor,
        mask: torch.Tensor,
    ) -> Tuple[torch.Tensor, Dict[str, torch.Tensor]]:
        """Compute auxiliary physics-informed loss terms.

        Parameters
        ----------
        pred_phys   : (B, T_out, 3, H, W) predicted [rain, tmax, tmin] in physical units
        target_phys : (B, T_out, 3, H, W) ground-truth [rain, tmax, tmin] in physical units
        mask        : (H, W) bool land validity mask
        """
        rain_p = pred_phys[:, :, 0]
        tmax_p = pred_phys[:, :, 1]
        tmin_p = pred_phys[:, :, 2]

        rain_t = torch.clamp(target_phys[:, :, 0], min=0.0)
        tmax_t = target_phys[:, :, 1]
        tmin_t = target_phys[:, :, 2]

        # 1. Thermodynamic ordering: Tmax must be >= Tmin (DTR >= 0)
        dtr_p = tmax_p - tmin_p
        loss_dtr_order = self._masked_mean(F.relu(-dtr_p), mask)

        # 2. Rain non-negativity
        loss_rain_nonneg = self._masked_mean(F.relu(-rain_p), mask)

        # 3. DTR-Rainfall coupling: heavy rain narrows diurnal temperature range
        dtr_t = tmax_t - tmin_t
        heavy_rain_weight = torch.sigmoid((rain_t - 10.0) / 5.0)
        loss_dtr_coupling = self._masked_mean(
            heavy_rain_weight * F.smooth_l1_loss(dtr_p, dtr_t, reduction="none"),
            mask,
        )

        # 4. Clausius-Clapeyron moisture-temperature scaling consistency:
        #    Penalize extreme rainfall deviations exceeding CC capacity scaling
        t_mean_p = 0.5 * (tmax_p + tmin_p)
        t_mean_t = 0.5 * (tmax_t + tmin_t)
        cc_factor = torch.exp(self.cc_rate_per_kelvin * (t_mean_p - t_mean_t))
        rain_cc_bound = rain_t * cc_factor + 5.0  # 5 mm/d convective tolerance
        loss_cc = self._masked_mean(
            F.relu(torch.clamp(rain_p, min=0.0) - rain_cc_bound), mask
        )

        total = (
            self.w_dtr_order * loss_dtr_order
            + self.w_rain_nonneg * loss_rain_nonneg
            + self.w_dtr_rain_coupling * loss_dtr_coupling
            + self.w_cc_scaling * loss_cc
        )
        breakdown = {
            "physics_total": total.detach(),
            "dtr_order": loss_dtr_order.detach(),
            "rain_nonneg": loss_rain_nonneg.detach(),
            "dtr_coupling": loss_dtr_coupling.detach(),
            "cc_scaling": loss_cc.detach(),
        }
        return total, breakdown
