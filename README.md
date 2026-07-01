# India's Digital Twin

**AI-Powered Digital Twin of India's Climate using India's National Data**

Bharatiya Antariksh Hackathon 2026 - Challenge 05
Team **Pull_Request Pending** — Aditya, Kavya, Anas

---

## Overview

This project is a Proof-of-Concept AI-powered digital twin of India's climate, built for ISRO's Bharatiya Antariksh Hackathon 2026. It uses national datasets — IMD gridded rainfall and temperature records, and INSAT-3R satellite products, to simulate, predict, and visualize climate conditions over a pilot region.

The system combines a ConvLSTM deep learning model trained on historical climate data with an interactive map dashboard, allowing users to explore both real observed conditions and AI-generated predictions, including a "what-if" scenario engine to simulate the impact of changing rainfall or temperature inputs.

**Pilot region:** Kerala

### What it does

- Visualizes daily rainfall, maximum temperature, and minimum temperature across Delhi NCR using IMD's 0.25°–1° gridded datasets
- Predicts next-day climate conditions using a ConvLSTM model trained on input sequences
- Compares predicted values against real observations to validate model accuracy
- Lets users simulate "what-if" scenarios — adjusting rainfall or temperature inputs to see how the predicted climate state responds
- Presents all of this through an interactive, map-based dashboard

### Why it matters

India's climate, particularly monsoon rainfall and temperature extremes, is highly variable and difficult to model at fine spatial resolution using conventional methods. A digital twin built on India's own satellite and meteorological data supports climate resilience, disaster preparedness, and data-driven decision-making, in line with ISRO's vision for indigenous AI-powered climate intelligence.

---

## Live Links

- **Dashboard:** _https://digitaltwin-in.vercel.app/_
- **Presentation:** _https://digitaltwin-in.vercel.app/presentation.pdf_
- **GitHub Repository:** _https://github.com/anasalam-xyz/digital-twin_

---

## Technical Details

### Architecture

```
Data Sources (IMD, INSAT-3R)
        ↓
Preprocessing (xarray, scipy, pandas)
        ↓
ConvLSTM Model (PyTorch)
        ↓
Prediction API
        ↓
Frontend Dashboard (Next.js, TailwindCSS)
```

### Datasets

**IMD Gridded Data (Primary)**
| Variable | Resolution | Grid Shape | Unit |
|---|---|---|---|---|
| Rainfall (`rain`) | 0.25° × 0.25° (~25km) | 129 × 135 | mm/day | 
| Max Temperature (`tmax`) | 1° × 1° (~100km) | 31 × 31 | °C |
| Min Temperature (`tmin`) | 1° × 1° (~100km) | 31 × 31 | °C |

- Source: [imdpune.gov.in](https://www.imdpune.gov.in/)
- Accessed via the `imdlib` Python library, parsed from `.GRD` binary format into `xarray` Datasets
- Missing values flagged as `99.9` are masked during preprocessing
- Spatial coverage: 6.5°N–38.5°N, 66.5°E–100°E

**INSAT-3R / MOSDAC (Secondary)**
- Land Surface Temperature (`3RIMG_L2B_LST`), Sea Surface Temperature (`3RIMG_L2B_SST`) and Rainfall (`3RIMG_L2B_IMC`) products
- Source: [mosdac.gov.in](https://www.mosdac.gov.in/)
- Format: NetCDF
- Status: awaiting access verification

### Machine Learning

- **Model:** ConvLSTM (Convolutional LSTM)
- **Input:** Sequences of spatial rainfall/temperature fields
- **Output:** Next-day prediction for rainfall and temperature, per grid cell
- **Framework:** PyTorch

### Frontend

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **Map rendering:** Leaflet (`react-leaflet`)

### Dashboard Features

- **Variable toggle** — switch between Rainfall, Max Temp, Min Temp
- **Overlay modes** — Actual (observed IMD data), Predicted (model output), Anomaly (predicted − actual deviation)
- **Time scrubber** — navigate across the full dataset
- **What-if scenario engine** — adjust rainfall/temperature deltas and simulate the model's predicted response
- **Grid point inspection** — click any cell to view exact coordinates, actual vs. predicted values, and 7-day history

---

## Getting Started

### Prerequisites

- Node.js 18+

### Setup

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

### Build

```bash
npm run build
npm run start
```

## Project Status

This is an active Proof-of-Concept built within hackathon constraints. Current scope is limited to the Delhi NCR pilot region with IMD data; INSAT-3R integration and broader national coverage are part of the scalability roadmap described in the challenge objectives.

| Component | Status |
|---|---|
| IMD data pipeline | Validated |
| INSAT-3R integration | Pending access |
| ConvLSTM model | Trained Successfuly |
| Dashboard (frontend) |  Functional with mock data |
| API integration | In progress |
| Deployment | https://digitaltwin-in.vercel.app/ |

---

## Team

**Pull_Request Pending**
- Aditya
- Kavya
- Anas

Built for the Bharatiya Antariksh Hackathon 2026, Challenge 05 — AI-Powered Digital Twin of India's Climate.
