export type Variable = "rain" | "tmax" | "tmin";
export type OverlayMode = "actual" | "predicted" | "anomaly" | "whatif";

export interface ChannelValues {
  rain: number | null;
  tmax: number | null;
  tmin: number | null;
}

export interface ChannelSeries {
  rain: (number | null)[];
  tmax: (number | null)[];
  tmin: (number | null)[];
}

export interface ForecastCell {
  lat: number;
  lon: number;
  r: number;
  c: number;
  actual: ChannelValues;
  predicted: ChannelValues;
  history_7d: ChannelSeries;
  forecast_7d: ChannelSeries;
  actual_7d: ChannelSeries;
}

export interface ForecastResponse {
  date: string;
  forecast_date: string;
  lead_day: number;
  forecast_dates: string[];
  split: "train" | "validation";
  latency_ms: number;
  domain_summary: {
    actual_7d: ChannelSeries;
    predicted_7d: ChannelSeries;
    history_7d: ChannelSeries;
  };
  grid: ForecastCell[];
}

export interface SimulatedCell {
  lat: number;
  lon: number;
  r: number;
  c: number;
  baseline: ChannelValues;
  simulated: ChannelValues;
  delta: ChannelValues;
  simulated_7d: ChannelSeries;
  baseline_7d: ChannelSeries;
}

export interface SimulateResponse {
  date: string;
  lead_day: number;
  perturbations: {
    rainfall_delta: number;
    tmax_delta: number;
    tmin_delta: number;
  };
  latency_ms: number;
  note: string;
  domain_summary: {
    baseline_7d: ChannelSeries;
    simulated_7d: ChannelSeries;
  };
  grid: SimulatedCell[];
}

export interface HealthResponse {
  status: string;
  model: string;
  params: number;
  device: string;
  best_epoch: number;
  best_val_rmse: number;
  date_start: string;
  date_end: string;
  total_days: number;
  valid_cells: number;
  grid_shape: [number, number];
}

export interface DiagnosticsResponse {
  model: string;
  params: number;
  best_epoch: number;
  best_val_rmse: number;
  metrics_2025: {
    rain: { rmse: number; mae: number; r2: number; pearson: number; bias: number };
    tmax: { rmse: number; mae: number; r2: number; pearson: number; bias: number };
    tmin: { rmse: number; mae: number; r2: number; pearson: number; bias: number };
    csi: Record<string, number>;
  };
  training_history: Array<{
    epoch: number;
    train_loss: number;
    val_loss: number;
    train_rmse: number;
    val_rmse: number;
    train_mae: number;
    val_mae: number;
    lr: number;
  }>;
  plots: string[];
}
