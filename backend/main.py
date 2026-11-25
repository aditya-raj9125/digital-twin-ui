"""FastAPI inference & What-If Simulation server for ClimateDualNet."""

from __future__ import annotations

import json
import os
import time
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import torch
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from backend.model import ClimateDualNet, FORECAST_LEN, HISTORY_LEN

ROOT_DIR = Path(__file__).resolve().parent.parent
ISRO_DIR = ROOT_DIR / "ISRO_BAH_2026"
CHECKPOINT_PATH = ISRO_DIR / "checkpoints" / "best_model.pt"
NORM_STATS_PATH = ISRO_DIR / "normalization_stats.json"
TRAIN_NPZ_PATH = ISRO_DIR / "processed" / "stacked_tensor" / "train_tensor_kerala.npz"
VAL_NPZ_PATH = ISRO_DIR / "processed" / "stacked_tensor" / "validation_tensor_kerala.npz"
HISTORY_JSON_PATH = ISRO_DIR / "training_history" / "training_history.json"
PLOTS_DIR = ISRO_DIR / "plots"

CHANNEL_KEYS = ("rain", "tmax", "tmin")

app = FastAPI(
    title="India Climate Digital Twin API",
    description="Live PyTorch inference & What-If Sensitivity Simulator for ClimateDualNet (Kerala 0.25° × 0.25°)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _ensure_artifacts() -> None:
    """Download model artifacts from Hugging Face Hub if missing locally and HF_MODEL_REPO is set."""
    if CHECKPOINT_PATH.exists() and TRAIN_NPZ_PATH.exists() and VAL_NPZ_PATH.exists():
        return
    hf_repo = os.environ.get("HF_MODEL_REPO", "Adityahars/climate-digital-twin-kerala")
    if not hf_repo:
        raise FileNotFoundError(
            f"Missing model artifacts under {ISRO_DIR}. "
            "Place ISRO_BAH_2026/ locally or set HF_MODEL_REPO to a Hugging Face repo ID."
        )
    from huggingface_hub import snapshot_download

    snapshot_download(
        repo_id=hf_repo,
        repo_type=os.environ.get("HF_MODEL_REPO_TYPE", "model"),
        local_dir=str(ISRO_DIR),
        token=os.environ.get("HF_TOKEN"),
    )


class DigitalTwinEngine:
    """Holds the loaded ClimateDualNet model, normalization stats, and IMD Kerala tensors."""

    def __init__(self) -> None:
        _ensure_artifacts()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        with open(NORM_STATS_PATH, "r", encoding="utf-8") as f:
            stats = json.load(f)
        self.mean = np.array(stats["mean"], dtype=np.float32)
        self.std = np.array(stats["std"], dtype=np.float32)
        self.use_log1p: List[bool] = list(stats["use_log1p"])

        train_data = np.load(TRAIN_NPZ_PATH, allow_pickle=True)
        val_data = np.load(VAL_NPZ_PATH, allow_pickle=True)

        self.tensor = np.concatenate(
            [train_data["tensor"], val_data["tensor"]], axis=0
        ).astype(np.float32)
        self.dates: List[str] = [
            str(d) for d in np.concatenate([train_data["dates"], val_data["dates"]], axis=0)
        ]
        self.date_to_idx: Dict[str, int] = {d: i for i, d in enumerate(self.dates)}
        self.latitudes: np.ndarray = train_data["latitudes"].astype(np.float32)
        self.longitudes: np.ndarray = train_data["longitudes"].astype(np.float32)
        self.mask: np.ndarray = train_data["rainfall_mask"].astype(bool)
        self.valid_coords = np.argwhere(self.mask)  # (156, 2) -> (r, c)

        self.model = ClimateDualNet().to(self.device)
        ckpt = torch.load(CHECKPOINT_PATH, map_location=self.device, weights_only=False)
        state_dict = ckpt["model"] if isinstance(ckpt, dict) and "model" in ckpt else ckpt
        self.model.load_state_dict(state_dict)
        self.model.eval()
        self.best_epoch = int(ckpt.get("epoch", 0)) if isinstance(ckpt, dict) else 0
        self.best_val_rmse = (
            float(ckpt.get("best_val_rmse", 0.0)) if isinstance(ckpt, dict) else 0.0
        )
        self.n_params = sum(p.numel() for p in self.model.parameters())

    def normalize(self, window: np.ndarray) -> np.ndarray:
        """Normalize (T, 3, H, W) physical window to model input space."""
        out = np.empty_like(window, dtype=np.float32)
        for c in range(window.shape[1]):
            ch = window[:, c].copy()
            if self.use_log1p[c]:
                ch = np.log1p(np.maximum(ch, 0.0))
            out[:, c] = (ch - self.mean[c]) / self.std[c]
        return np.nan_to_num(out, nan=0.0, posinf=0.0, neginf=0.0)

    def denormalize(self, pred_norm: np.ndarray) -> np.ndarray:
        """Denormalize (T_out, 3, H, W) model output to physical units."""
        out = np.empty_like(pred_norm, dtype=np.float32)
        for c in range(pred_norm.shape[1]):
            phys = pred_norm[:, c] * self.std[c] + self.mean[c]
            if self.use_log1p[c]:
                phys = np.expm1(phys)
                phys = np.maximum(phys, 0.0)
            out[:, c] = phys
        return out

    def resolve_index(self, date_str: str) -> int:
        if date_str in self.date_to_idx:
            return self.date_to_idx[date_str]
        # Fallback to nearest date if exact date not found
        if date_str <= self.dates[0]:
            return 0
        if date_str >= self.dates[-1]:
            return len(self.dates) - 1
        # Binary search
        import bisect

        pos = bisect.bisect_left(self.dates, date_str)
        return min(pos, len(self.dates) - 1)

    def get_history_window(self, target_idx: int) -> np.ndarray:
        """Return 30-day physical history window ending at target_idx - 1."""
        end = max(target_idx, HISTORY_LEN)
        start = end - HISTORY_LEN
        return self.tensor[start:end].copy()

    @torch.no_grad()
    def predict_window(self, window_phys: np.ndarray) -> np.ndarray:
        """Run ClimateDualNet on (30, 3, H, W) physical window -> (7, 3, H, W) physical."""
        norm = self.normalize(window_phys)
        x = torch.from_numpy(norm).unsqueeze(0).to(self.device)
        y_norm = self.model(x).squeeze(0).cpu().numpy()
        return self.denormalize(y_norm)

    @lru_cache(maxsize=256)
    def cached_baseline_forecast(self, target_idx: int) -> np.ndarray:
        hist = self.get_history_window(target_idx)
        return self.predict_window(hist)

    def get_actual_forecast_slice(self, target_idx: int) -> np.ndarray:
        """Return actual observations for [target_idx : target_idx + 7], padded if near end."""
        out = np.full((FORECAST_LEN, 3, len(self.latitudes), len(self.longitudes)), np.nan, dtype=np.float32)
        avail = min(FORECAST_LEN, len(self.dates) - target_idx)
        if avail > 0:
            out[:avail] = self.tensor[target_idx : target_idx + avail]
        return out

    def get_7d_history_slice(self, target_idx: int) -> np.ndarray:
        """Return 7 days of actuals ending at target_idx - 1."""
        end = max(target_idx, 7)
        start = end - 7
        return self.tensor[start:end].copy()


engine = DigitalTwinEngine()


class SimulateRequest(BaseModel):
    date: str = Field(..., description="Target forecast date YYYY-MM-DD")
    rainfall_delta: float = Field(0.0, ge=-100.0, le=200.0)
    temp_delta: float = Field(0.0, ge=-15.0, le=15.0)
    tmax_delta: Optional[float] = Field(None, ge=-15.0, le=15.0)
    tmin_delta: Optional[float] = Field(None, ge=-15.0, le=15.0)
    lead_day: int = Field(0, ge=0, le=6)


def _cell_dict(arr_3: np.ndarray, r: int, c: int) -> Dict[str, Optional[float]]:
    res: Dict[str, Optional[float]] = {}
    for i, key in enumerate(CHANNEL_KEYS):
        val = float(arr_3[i, r, c])
        res[key] = None if np.isnan(val) else round(val, 3)
    return res


def _series_dict(arr_t3: np.ndarray, r: int, c: int) -> Dict[str, List[Optional[float]]]:
    out: Dict[str, List[Optional[float]]] = {}
    for i, key in enumerate(CHANNEL_KEYS):
        vals = []
        for t in range(arr_t3.shape[0]):
            v = float(arr_t3[t, i, r, c])
            vals.append(None if np.isnan(v) else round(v, 3))
        out[key] = vals
    return out


def _domain_mean(arr_t3: np.ndarray) -> Dict[str, List[Optional[float]]]:
    out: Dict[str, List[Optional[float]]] = {}
    for i, key in enumerate(CHANNEL_KEYS):
        vals = []
        for t in range(arr_t3.shape[0]):
            masked = arr_t3[t, i][engine.mask]
            valid = masked[~np.isnan(masked)]
            vals.append(round(float(valid.mean()), 3) if valid.size > 0 else None)
        out[key] = vals
    return out


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "model": "ClimateDualNet",
        "params": engine.n_params,
        "device": str(engine.device),
        "best_epoch": engine.best_epoch,
        "best_val_rmse": round(engine.best_val_rmse, 4),
        "date_start": engine.dates[0],
        "date_end": engine.dates[-1],
        "total_days": len(engine.dates),
        "valid_cells": int(len(engine.valid_coords)),
        "grid_shape": [int(len(engine.latitudes)), int(len(engine.longitudes))],
    }


@app.get("/api/forecast")
def get_forecast(
    date: str = Query("2025-06-15"),
    lead_day: int = Query(0, ge=0, le=6),
) -> Dict[str, Any]:
    t0 = time.perf_counter()
    idx = engine.resolve_index(date)
    resolved_date = engine.dates[idx]
    forecast_idx = min(idx + lead_day, len(engine.dates) - 1)
    forecast_date = engine.dates[forecast_idx]

    pred_7d = engine.cached_baseline_forecast(idx)  # (7, 3, H, W)
    actual_7d = engine.get_actual_forecast_slice(idx)  # (7, 3, H, W)
    hist_7d = engine.get_7d_history_slice(idx)  # (7, 3, H, W)

    grid = []
    for r, c in engine.valid_coords:
        r_i, c_i = int(r), int(c)
        grid.append(
            {
                "lat": float(engine.latitudes[r_i]),
                "lon": float(engine.longitudes[c_i]),
                "r": r_i,
                "c": c_i,
                "actual": _cell_dict(actual_7d[lead_day], r_i, c_i),
                "predicted": _cell_dict(pred_7d[lead_day], r_i, c_i),
                "history_7d": _series_dict(hist_7d, r_i, c_i),
                "forecast_7d": _series_dict(pred_7d, r_i, c_i),
                "actual_7d": _series_dict(actual_7d, r_i, c_i),
            }
        )

    forecast_dates = [
        engine.dates[min(idx + k, len(engine.dates) - 1)] for k in range(FORECAST_LEN)
    ]
    latency_ms = round((time.perf_counter() - t0) * 1000, 2)

    return {
        "date": resolved_date,
        "forecast_date": forecast_date,
        "lead_day": lead_day,
        "forecast_dates": forecast_dates,
        "split": "validation" if resolved_date >= "2025-01-01" else "train",
        "latency_ms": latency_ms,
        "domain_summary": {
            "actual_7d": _domain_mean(actual_7d),
            "predicted_7d": _domain_mean(pred_7d),
            "history_7d": _domain_mean(hist_7d),
        },
        "grid": grid,
    }


@app.post("/api/simulate")
def simulate_what_if(req: SimulateRequest) -> Dict[str, Any]:
    t0 = time.perf_counter()
    idx = engine.resolve_index(req.date)
    resolved_date = engine.dates[idx]
    lead_day = req.lead_day

    tmax_d = req.tmax_delta if req.tmax_delta is not None else req.temp_delta
    tmin_d = req.tmin_delta if req.tmin_delta is not None else req.temp_delta

    hist_base = engine.get_history_window(idx)  # (30, 3, H, W)
    pred_base = engine.cached_baseline_forecast(idx)  # (7, 3, H, W)

    hist_pert = hist_base.copy()
    # Apply physical-unit perturbations on valid land cells across the 30-day context window
    land_mask = engine.mask  # (H, W)
    if req.rainfall_delta != 0.0:
        rain_ch = hist_pert[:, 0, land_mask]
        rain_ch = np.where(np.isnan(rain_ch), np.nan, np.maximum(0.0, rain_ch + req.rainfall_delta))
        hist_pert[:, 0, land_mask] = rain_ch
    if tmax_d != 0.0:
        tmax_ch = hist_pert[:, 1, land_mask]
        hist_pert[:, 1, land_mask] = np.where(np.isnan(tmax_ch), np.nan, tmax_ch + tmax_d)
    if tmin_d != 0.0:
        tmin_ch = hist_pert[:, 2, land_mask]
        hist_pert[:, 2, land_mask] = np.where(np.isnan(tmin_ch), np.nan, tmin_ch + tmin_d)

    pred_sim = engine.predict_window(hist_pert)  # (7, 3, H, W)

    grid = []
    for r, c in engine.valid_coords:
        r_i, c_i = int(r), int(c)
        base_cell = _cell_dict(pred_base[lead_day], r_i, c_i)
        sim_cell = _cell_dict(pred_sim[lead_day], r_i, c_i)
        delta_cell = {
            k: round((sim_cell[k] or 0.0) - (base_cell[k] or 0.0), 3)
            for k in CHANNEL_KEYS
        }
        grid.append(
            {
                "lat": float(engine.latitudes[r_i]),
                "lon": float(engine.longitudes[c_i]),
                "r": r_i,
                "c": c_i,
                "baseline": base_cell,
                "simulated": sim_cell,
                "delta": delta_cell,
                "simulated_7d": _series_dict(pred_sim, r_i, c_i),
                "baseline_7d": _series_dict(pred_base, r_i, c_i),
            }
        )

    latency_ms = round((time.perf_counter() - t0) * 1000, 2)
    return {
        "date": resolved_date,
        "lead_day": lead_day,
        "perturbations": {
            "rainfall_delta": req.rainfall_delta,
            "tmax_delta": tmax_d,
            "tmin_delta": tmin_d,
        },
        "latency_ms": latency_ms,
        "note": "Model sensitivity analysis: outputs reflect ClimateDualNet's learned response to perturbed 30-day input fields.",
        "domain_summary": {
            "baseline_7d": _domain_mean(pred_base),
            "simulated_7d": _domain_mean(pred_sim),
        },
        "grid": grid,
    }


@app.get("/api/diagnostics")
def get_diagnostics() -> Dict[str, Any]:
    history = []
    if HISTORY_JSON_PATH.exists():
        with open(HISTORY_JSON_PATH, "r", encoding="utf-8") as f:
            history = json.load(f)

    plots = []
    if PLOTS_DIR.exists():
        plots = sorted([p.name for p in PLOTS_DIR.glob("*.png")])

    return {
        "model": "ClimateDualNet",
        "params": engine.n_params,
        "best_epoch": engine.best_epoch,
        "best_val_rmse": round(engine.best_val_rmse, 4),
        "metrics_2025": {
            "rain": {"rmse": 14.5408, "mae": 5.5982, "r2": 0.1478, "pearson": 0.5343, "bias": -4.2433},
            "tmax": {"rmse": 1.3064, "mae": 1.0013, "r2": 0.7506, "pearson": 0.8712, "bias": 0.0002},
            "tmin": {"rmse": 0.7885, "mae": 0.5593, "r2": 0.8654, "pearson": 0.9343, "bias": 0.1764},
            "csi": {"0.1mm": 0.5832, "1.0mm": 0.5053, "5.0mm": 0.3447, "10.0mm": 0.2436},
        },
        "training_history": history,
        "plots": plots,
    }


@app.get("/api/plots/{filename}")
def get_plot(filename: str) -> FileResponse:
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = PLOTS_DIR / filename
    if not path.exists() or path.suffix.lower() != ".png":
        raise HTTPException(status_code=404, detail="Plot not found")
    return FileResponse(path, media_type="image/png")
