---
title: India Climate Digital Twin
emoji: 🌏
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# 🌏 AI-Powered Digital Twin of India's Climate

[![Deployed on Vercel](https://img.shields.io/badge/UI%20Prototype-Vercel-black?logo=vercel&logoColor=white)](https://digitaltwin-in.vercel.app/)
[![Hugging Face Model](https://img.shields.io/badge/Hugging%20Face-Model%20Artifacts-FFD21E?logo=huggingface&logoColor=black)](https://huggingface.co/Adityahars/climate-digital-twin-kerala)
[![PyTorch](https://img.shields.io/badge/Model-PyTorch%20ClimateDualNet-EE4C2C?logo=pytorch&logoColor=white)](#model-architecture)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20%2B%20Leaflet-000000?logo=nextdotjs&logoColor=white)](#system-architecture)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](#)

An end-to-end **Climate Digital Twin** for short-range (`1–7` day) spatiotemporal weather forecasting and interactive **"What-If" sensitivity analysis** over the **Kerala & Southern Peninsular India pilot domain** (`8.0°N–13.0°N`, `74.5°E–77.5°E`, `0.25° × 0.25°` grid, `156` valid land cells), built on official **India Meteorological Department (IMD)** daily gridded datasets (`2012–2025`).

---

## 📌 Key Capabilities

- **Live PyTorch Inference (`ClimateDualNet`, `3.05M` params):** Generates 7-day forecasts (`D+1` to `D+7`) for **Rainfall** (`mm/day`), **Maximum Temperature** (`Tmax`, `°C`), and **Minimum Temperature** (`Tmin`, `°C`) from a rolling 30-day historical window.
- **Interactive Geospatial Map (Leaflet):** Inspect all `156` valid `0.25° × 0.25°` land cells across four live overlays:
  - **Actual** — Ground-truth IMD gridded observations (`2012–2025`).
  - **Predicted** — Live `ClimateDualNet` model predictions.
  - **Δ Anomaly** — Spatial prediction residual (`Predicted − Actual`).
  - **What-If Δ** — Spatial sensitivity response (`Simulated − Baseline`).
- **Interactive What-If Sensitivity Simulator:** Perturb `Rainfall Δ` (`-50` to `+100 mm`), `Tmax Δ` (`-10` to `+10 °C`), and `Tmin Δ` (`-10` to `+10 °C`) — or apply presets (*Extreme Monsoon*, *Heatwave*, *Dry Spell*, *Warm & Wet*) — and re-run live `ClimateDualNet` inference to compare baseline vs. perturbed 7-day trajectories.
- **2025 Validation Diagnostics:** Built-in modal surfacing held-out 2025 evaluation metrics (`RMSE`, `MAE`, `R²`, `Pearson`, `CSI`) and `15` diagnostic plots.

---

## 🏗️ System Architecture

The application pairs a **Next.js 16 / React 19** interactive map frontend with a **FastAPI + PyTorch** inference backend connected via Next.js server rewrites (`/api/model/* → http://127.0.0.1:8000/api/*`).

```mermaid
flowchart LR
    subgraph Client["Frontend: Next.js 16 + Leaflet UI (Port 3000 / 7860)"]
        direction TB
        Map["ClimateMap.tsx<br/>(156 Land Cells · 4 Overlays)"]
        Sidebar["DashboardSidebar.tsx<br/>(Variable Switcher & What-If Sliders)"]
        Timebar["DashboardTimebar.tsx<br/>(2012–2025 Timeline · D+1..D+7)"]
        Right["DashboardRightPanel.tsx<br/>(Actual vs Pred · 7D Chart · Sensitivity)"]
        Modal["DiagnosticsModal.tsx<br/>(2025 Metrics & Plots)"]
    end

    Proxy["Next.js Rewrite Proxy<br/>/api/model/:path*"]

    subgraph Backend["Backend: FastAPI + PyTorch (Port 8000)"]
        direction TB
        API["backend/main.py<br/>(/health, /forecast, /simulate, /diagnostics)"]
        Engine["DigitalTwinEngine<br/>(LRU Cache · Mask & Norm Pipeline)"]
        Model["ClimateDualNet<br/>(best_model.pt · 3.05M params)"]
    end

    subgraph Data["Artifacts & IMD Tensors (ISRO_BAH_2026 / HF Hub)"]
        NPZ["Kerala .npz Tensors<br/>(2012–2024 Train · 2025 Val)"]
        Stats["normalization_stats.json<br/>(log1p + z-score)"]
        Plots["2025 Diagnostic Plots (.png)"]
    end

    Client --> Proxy --> API
    API --> Engine --> Model
    Engine --> NPZ
    Engine --> Stats
    API --> Plots
```

---

## 🧠 Model Architecture

### Phase 1 (Active): `ClimateDualNet` — Spatiotemporal Branch (Branch 2)

The deployed model takes a normalized 30-day history tensor `(B, 30, 3, 21, 13)` and predicts the next 7 days `(B, 7, 3, 21, 13)`:

```mermaid
flowchart TD
    In["Input Window: (B, 30, 3, 21, 13)<br/>Channels: Rainfall (log1p), Tmax, Tmin"]
    Enc["Per-Frame Residual CNN Encoder<br/>3 → 32 → 64 → 128 channels (BatchNorm + ReLU)"]
    CBAM["CBAM Attention<br/>(Channel + Spatial Attention on 128-ch maps)"]
    LSTM["2-Layer ConvLSTM<br/>(hidden=128, kernel=3×3, dropout=0.2)"]
    Attn["Temporal Self-Attention<br/>(4 Heads over 30 timesteps)"]
    Dec["U-Net Decoder with Skip Connections<br/>(128+128 → 64 → 32 channels)"]

    H1["Head: Rainfall<br/>(B, 7, 21, 13)"]
    H2["Head: Tmax<br/>(B, 7, 21, 13)"]
    H3["Head: Tmin<br/>(B, 7, 21, 13)"]
    Out["Forecast Output: (B, 7, 3, 21, 13)"]

    In --> Enc --> CBAM --> LSTM --> Attn --> Dec
    Enc -. "Skip s1, s2, s3 (last frame)" .-> Dec
    Dec --> H1 & H2 & H3 --> Out
```

### Phase 2 (Scaffolded, Unwired): Multi-Branch Architecture (`backend/branches/`)

Standalone Phase 2 modules have been implemented under `backend/branches/` for future joint retraining (not yet wired into `ClimateDualNet` or live inference):

```mermaid
flowchart LR
    X["30-Day Input<br/>(B, 30, 3, H, W)"]
    B1["Branch 1: PhysicsInformedBranch<br/>(DTR, Tetens e_s, dT/dt → 64-ch)"]
    B2["Branch 2: ClimateDualNet<br/>(CNN + CBAM + ConvLSTM + UNet → 32-ch)"]
    B3["Branch 3: HierarchicalTrendBranch<br/>(Masked Stats + GRU + Calendar → 64-ch)"]
    F["MultiBranchFusion<br/>(Spatial Softmax Attention Gate)"]
    Out["Point Forecast + Uncertainty<br/>(B, 7, 3, H, W) + Branch Weights"]
    Loss["PhysicsInformedLoss<br/>(Tmax ≥ Tmin, DTR-Rain, Clausius-Clapeyron)"]

    X --> B1 & B2 & B3
    B1 & B2 & B3 --> F --> Out
    Out -. "Training Constraint" .-> Loss
```

---

## 🔄 What-If Sensitivity Simulation Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js Dashboard
    participant API as FastAPI (/api/simulate)
    participant Net as ClimateDualNet (PyTorch)

    User->>UI: Set Rainfall Δ, Tmax Δ, Tmin Δ & click "Run What-If Model"
    UI->>API: POST /api/model/simulate {date, deltas, lead_day}
    API->>API: Load 30-day physical history X_hist (30, 3, 21, 13)
    API->>Net: Forward pass on normalized X_hist
    Net-->>API: Baseline 7-day forecast Y_base
    API->>API: Perturb valid land cells (Rain ≥ 0, Tmax + Δ, Tmin + Δ)
    API->>Net: Forward pass on normalized X_pert
    Net-->>API: Simulated 7-day forecast Y_sim
    API-->>UI: Return Baseline, Simulated, and Δ = Y_sim - Y_base
    UI->>User: Render "What-If Δ" map & Baseline vs. Simulated 7D bars
```

> **Note:** Outputs from the What-If Simulator represent **model sensitivity analysis** (how `ClimateDualNet` responds to perturbed 30-day inputs), not physics-constrained climate projections.

---

## 📊 2025 Held-Out Validation Performance

Evaluated on unseen 2025 IMD data (`365` days, `156` valid land cells; from [evaluation_report.md](ISRO_BAH_2026/predictions/evaluation_report.md)):

| Variable | RMSE | MAE | R² | Pearson r | Bias |
|---|---:|---:|---:|---:|---:|
| **Rainfall** (`mm/day`) | `14.5408` | `5.5982` | `0.1478` | `0.5343` | `-4.2433` |
| **Max Temp (`Tmax`)** (`°C`) | `1.3064` | `1.0013` | `0.7506` | `0.8712` | `+0.0002` |
| **Min Temp (`Tmin`)** (`°C`) | `0.7885` | `0.5593` | `0.8654` | `0.9343` | `+0.1764` |

**Rainfall Critical Success Index (CSI):** `0.5832` (`≥ 0.1 mm`) · `0.5053` (`≥ 1.0 mm`) · `0.3447` (`≥ 5.0 mm`) · `0.2436` (`≥ 10.0 mm`).

---

## 🔌 Backend API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Model status, parameter count, device, date coverage, and grid shape |
| `/api/forecast?date=YYYY-MM-DD&lead_day=0..6` | `GET` | Live 7-day forecast vs. IMD actuals and 7-day history for all 156 land cells |
| `/api/simulate` | `POST` | Runs baseline vs. perturbed `ClimateDualNet` inference for What-If sensitivity |
| `/api/diagnostics` | `GET` | Returns 2025 validation metrics, training history, and available plot names |
| `/api/plots/{filename}` | `GET` | Serves diagnostic `.png` plots from `ISRO_BAH_2026/plots/` |

---

## 📁 Repository Structure

```text
digital-twin-ui/
├── app/
│   ├── page.tsx                        # Landing page
│   └── dashboard/page.tsx              # Interactive Digital Twin dashboard state & layout
├── components/dashboard/
│   ├── ClimateMap.tsx                  # Leaflet gridded map + 4 overlay modes
│   ├── DashboardSidebar.tsx            # Variable selector, What-If sliders & presets
│   ├── DashboardTimebar.tsx            # 2012–2025 timeline & D+1..D+7 horizon selector
│   ├── DashboardRightPanel.tsx         # Actual vs Pred, 7D bar chart & sensitivity stats
│   ├── DashboardTopbar.tsx             # Header, Kerala domain badge & live model status
│   └── DiagnosticsModal.tsx            # 2025 metrics & evaluation plot viewer
├── backend/
│   ├── model.py                        # ClimateDualNet PyTorch definition
│   ├── main.py                         # FastAPI inference & What-If server (+ HF Hub loader)
│   └── branches/                       # Standalone Phase 2 modules (unwired)
│       ├── physics_branch.py           # PhysicsInformedBranch & PhysicsInformedLoss
│       ├── hierarchical_trend_branch.py# HierarchicalTrendBranch
│       └── fusion.py                   # MultiBranchFusion (3-branch attention gate)
├── lib/climateTypes.ts                 # Shared TypeScript interfaces
├── next.config.ts                      # /api/model/* rewrite to FastAPI backend
├── Dockerfile                          # Multi-stage Docker build (Node 20 + Python 3.11)
├── start.sh                            # Container entrypoint (Uvicorn + Next.js on 7860)
└── requirements.txt                    # Python backend dependencies
```

---

## 🚀 Local Development

### Prerequisites
- **Node.js** `20+`
- **Python** `3.10+` with `torch`, `fastapi`, `uvicorn`, `numpy`, `pydantic`
- Model artifacts in `ISRO_BAH_2026/` (gitignored locally; auto-downloaded from Hugging Face Hub if `HF_MODEL_REPO` is set).

### 1. Start the FastAPI PyTorch Backend
```powershell
pip install -r requirements.txt
# Install PyTorch (CPU or CUDA) if not already installed:
# pip install torch==2.2.0 --index-url https://download.pytorch.org/whl/cpu

python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 2. Start the Next.js Frontend
```powershell
npm install
npm run dev
```
Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

---

## 🤗 Hugging Face Deployment

- **Model & Data Artifacts:** Hosted at [Adityahars/climate-digital-twin-kerala](https://huggingface.co/Adityahars/climate-digital-twin-kerala).
- **Docker Space Setup:** [Dockerfile](Dockerfile) and [start.sh](start.sh) bundle the Next.js production server (port `7860`) and FastAPI backend (port `8000`) in one container. On startup, `backend/main.py` automatically downloads artifacts from `HF_MODEL_REPO` (defaults to `Adityahars/climate-digital-twin-kerala`) when `ISRO_BAH_2026/` is not present locally.

> **Note:** Hosting Docker Spaces on Hugging Face requires a PRO subscription; for free hosting, deploy the Next.js UI on Vercel and set `MODEL_API_URL` to a hosted `backend/` instance.

---

## 🔗 Project Ecosystem

| Component | Link |
|---|---|
| **Model Artifacts (HF Hub)** | [huggingface.co/Adityahars/climate-digital-twin-kerala](https://huggingface.co/Adityahars/climate-digital-twin-kerala) |
| **UI Prototype (Vercel)** | [digitaltwin-in.vercel.app](https://digitaltwin-in.vercel.app/) |
| **Data Preprocessing Pipeline** | [github.com/aditya-raj9125/Digital-Twin](https://github.com/aditya-raj9125/Digital-Twin/tree/main) |
| **Training Notebook** | [Google Colab](https://colab.research.google.com/drive/1mf-kjpPhyaed0wkHWKu9GKIkK4DFwS6H?usp=sharing) |

---
*Developed as part of the AI-Powered Digital Twin of India's Climate Project.*
