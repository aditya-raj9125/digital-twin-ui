"use client";

import { useEffect, useState } from "react";
import { X, BarChart3, Image as ImageIcon } from "lucide-react";
import { DiagnosticsResponse } from "@/lib/climateTypes";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PLOT_LABELS: Record<string, string> = {
  "01_training_history.png": "Training & Validation Loss / RMSE",
  "02_scatter_predicted_vs_actual.png": "Predicted vs Actual Scatter (2025)",
  "03_residual_histograms.png": "Residual Error Distributions",
  "04_spatial_best_prediction.png": "Spatial Map — Best Prediction",
  "04_spatial_random_prediction.png": "Spatial Map — Sample Prediction",
  "04_spatial_worst_prediction.png": "Spatial Map — Worst Prediction",
  "05_error_heatmaps.png": "Spatial Error Heatmaps",
  "06_timeseries_comparison.png": "2025 Time-Series Comparison",
  "07_seasonal_comparison.png": "Seasonal Performance Comparison",
  "08_monthly_rmse.png": "Monthly RMSE Breakdown",
  "09_rainfall_intensity_distribution.png": "Rainfall Intensity Distribution",
  "10_best_model_selection.png": "Best Checkpoint Selection",
};

export default function DiagnosticsModal({ open, onClose }: Props) {
  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<string>("01_training_history.png");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || data) return;
    setLoading(true);
    fetch("/api/model/diagnostics")
      .then((r) => r.json())
      .then((d: DiagnosticsResponse) => {
        setData(d);
        if (d.plots?.length) setSelectedPlot(d.plots[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, data]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0D1B2A] border border-primary-accent/30 rounded-md w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-primary-accent/15 bg-[#132538]">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-4 h-4 text-secondary-accent" />
            <h2 className="font-display text-sm font-semibold text-white">
              ClimateDualNet — Training &amp; 2025 Validation Diagnostics
            </h2>
            {data && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary-accent/15 text-secondary-accent border border-primary-accent/30">
                {(data.params / 1e6).toFixed(2)}M params · Best Epoch {data.best_epoch}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-text hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {loading && <p className="text-xs text-muted-text font-mono">Loading diagnostics...</p>}

          {data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { label: "Rainfall (2025)", m: data.metrics_2025.rain, unit: "mm/d" },
                  { label: "Max Temp (2025)", m: data.metrics_2025.tmax, unit: "°C" },
                  { label: "Min Temp (2025)", m: data.metrics_2025.tmin, unit: "°C" },
                ].map(({ label, m, unit }) => (
                  <div key={label} className="bg-[#1A2E42] border border-primary-accent/15 rounded-sm p-3">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-primary-accent mb-2">
                      {label}
                    </p>
                    <div className="grid grid-cols-2 gap-y-1 font-mono text-xs">
                      <span className="text-muted-text">R²</span>
                      <span className="text-right text-secondary-accent font-semibold">{m.r2.toFixed(3)}</span>
                      <span className="text-muted-text">Pearson</span>
                      <span className="text-right text-white">{m.pearson.toFixed(3)}</span>
                      <span className="text-muted-text">RMSE</span>
                      <span className="text-right text-white">{m.rmse.toFixed(2)} {unit}</span>
                      <span className="text-muted-text">MAE</span>
                      <span className="text-right text-white">{m.mae.toFixed(2)} {unit}</span>
                    </div>
                  </div>
                ))}

                <div className="bg-[#1A2E42] border border-primary-accent/15 rounded-sm p-3">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-primary-accent mb-2">
                    Rainfall CSI (2025)
                  </p>
                  <div className="grid grid-cols-2 gap-y-1 font-mono text-xs">
                    {Object.entries(data.metrics_2025.csi).map(([thresh, val]) => (
                      <div key={thresh} className="contents">
                        <span className="text-muted-text">&ge; {thresh}</span>
                        <span className="text-right text-secondary-accent">{val.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
                <div className="bg-[#132538] border border-primary-accent/15 rounded-sm p-2 flex flex-col gap-1 max-h-[420px] overflow-y-auto">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-primary-accent px-2 py-1 flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3" /> Diagnostic Plots
                  </p>
                  {data.plots.map((plot) => (
                    <button
                      key={plot}
                      onClick={() => setSelectedPlot(plot)}
                      className={`text-left px-2.5 py-1.5 rounded-sm text-xs transition-colors cursor-pointer ${
                        selectedPlot === plot
                          ? "bg-primary-accent/20 text-secondary-accent border border-primary-accent/40"
                          : "text-muted-text hover:bg-[#1E3448] hover:text-white border border-transparent"
                      }`}
                    >
                      {PLOT_LABELS[plot] || plot}
                    </button>
                  ))}
                </div>

                <div className="bg-[#132538] border border-primary-accent/15 rounded-sm p-3 flex flex-col items-center justify-center min-h-[380px]">
                  {selectedPlot && (
                    <>
                      <p className="font-mono text-[10px] text-secondary-accent mb-2">
                        {PLOT_LABELS[selectedPlot] || selectedPlot}
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/model/plots/${encodeURIComponent(selectedPlot)}`}
                        alt={selectedPlot}
                        className="max-h-[380px] w-auto object-contain rounded bg-white"
                      />
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
