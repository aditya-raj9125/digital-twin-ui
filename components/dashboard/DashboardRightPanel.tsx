import {
  Variable,
  ForecastCell,
  ForecastResponse,
  SimulateResponse,
  SimulatedCell,
} from "@/lib/climateTypes";

const UNITS: Record<Variable, string> = { rain: "mm/day", tmax: "°C", tmin: "°C" };
const LABELS: Record<Variable, string> = { rain: "Rainfall", tmax: "Max Temp", tmin: "Min Temp" };

interface Props {
  selectedCell: ForecastCell | null;
  selectedSimCell: SimulatedCell | null;
  forecastData: ForecastResponse | null;
  simData: SimulateResponse | null;
  variable: Variable;
  date: string;
  leadDay: number;
  rainfallDelta: number;
  tmaxDelta: number;
  tminDelta: number;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1E3448] border border-primary-accent/15 rounded-sm p-3 flex-shrink-0">
      <p className="font-mono text-[8px] tracking-[0.18em] uppercase text-primary-accent mb-2.5">
        {title}
      </p>
      {children}
    </div>
  );
}

function StatRow({
  label,
  value,
  valueClass = "text-secondary-text",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-primary-accent/8 last:border-0">
      <span className="text-xs text-muted-text font-light">{label}</span>
      <span className={`font-mono text-xs ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function DashboardRightPanel({
  selectedCell,
  selectedSimCell,
  forecastData,
  simData,
  variable,
  date,
  leadDay,
  rainfallDelta,
  tmaxDelta,
  tminDelta,
}: Props) {
  const unit = UNITS[variable];
  const label = LABELS[variable];

  // Fall back to Kerala domain mean when no grid cell is clicked
  const actual =
    selectedCell?.actual[variable] ??
    forecastData?.domain_summary.actual_7d[variable]?.[leadDay] ??
    null;
  const predicted =
    selectedCell?.predicted[variable] ??
    forecastData?.domain_summary.predicted_7d[variable]?.[leadDay] ??
    null;

  const delta =
    actual !== null && predicted !== null ? predicted - actual : null;
  const pctError =
    actual !== null && predicted !== null && Math.abs(actual) > 0.1
      ? Math.abs(((predicted - actual) / actual) * 100).toFixed(0)
      : null;

  const historySeries =
    selectedCell?.history_7d[variable] ??
    forecastData?.domain_summary.history_7d[variable] ??
    [];
  const forecastSeries =
    selectedCell?.forecast_7d[variable] ??
    forecastData?.domain_summary.predicted_7d[variable] ??
    [];
  const simSeries =
    selectedSimCell?.simulated_7d[variable] ??
    simData?.domain_summary.simulated_7d[variable] ??
    [];

  const simVal =
    selectedSimCell?.simulated[variable] ??
    simData?.domain_summary.simulated_7d[variable]?.[leadDay] ??
    null;
  const baseVal =
    selectedSimCell?.baseline[variable] ??
    simData?.domain_summary.baseline_7d[variable]?.[leadDay] ??
    predicted;
  const simDiff =
    simVal !== null && baseVal !== null ? simVal - baseVal : null;

  const scaleBounds = {
    rain: { min: 0, max: 60 },
    tmax: { min: 22, max: 40 },
    tmin: { min: 15, max: 28 },
  }[variable];

  return (
    <div
      className="w-[275px] max-lg:w-full h-full bg-[#1A2E42] border-l border-primary-accent/15
      flex flex-col gap-3 px-3 py-3 overflow-y-auto
      max-lg:border-l-0 max-lg:border-t max-lg:flex-row max-lg:overflow-x-auto max-lg:h-auto"
    >
      <Card title={selectedCell ? "Selected Grid Cell" : "Kerala Domain Mean"}>
        {selectedCell ? (
          <>
            <StatRow label="Latitude" value={`${selectedCell.lat.toFixed(2)}°N`} />
            <StatRow label="Longitude" value={`${selectedCell.lon.toFixed(2)}°E`} />
            <StatRow label="Forecast Date" value={forecastData?.forecast_date || date} />
            <StatRow label="Lead Horizon" value={`Day +${leadDay + 1}`} />
          </>
        ) : (
          <>
            <StatRow label="Region" value="156 Land Cells" />
            <StatRow label="Forecast Date" value={forecastData?.forecast_date || date} />
            <StatRow label="Lead Horizon" value={`Day +${leadDay + 1}`} />
            <p className="text-[10px] text-muted-text mt-1.5 font-light">
              Click any grid cell on the map to inspect local values.
            </p>
          </>
        )}
      </Card>

      <Card title="Predicted vs Actual">
        {predicted !== null ? (
          <>
            <div className="grid grid-cols-[1fr_1px_1fr] gap-3 items-center">
              <div className="text-center">
                <p className="font-mono text-[8px] tracking-[0.12em] uppercase text-muted-text mb-1">
                  Actual
                </p>
                <p className="font-display text-2xl font-semibold text-primary-text">
                  {actual !== null ? actual.toFixed(1) : "—"}
                </p>
                <p className="font-mono text-[9px] text-muted-text mt-0.5">{unit}</p>
              </div>
              <div className="h-full w-px bg-primary-accent/15" />
              <div className="text-center">
                <p className="font-mono text-[8px] tracking-[0.12em] uppercase text-muted-text mb-1">
                  Model Pred
                </p>
                <p className="font-display text-2xl font-semibold text-secondary-accent">
                  {predicted.toFixed(1)}
                </p>
                <p className="font-mono text-[9px] text-muted-text mt-0.5">{unit}</p>
              </div>
            </div>
            {delta !== null && (
              <div className="flex items-center justify-center gap-1.5 mt-2.5 font-mono text-[9px]">
                <span className={delta >= 0 ? "text-amber-400" : "text-green-400"}>
                  {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)} {unit}
                </span>
                {pctError && (
                  <>
                    <span className="text-muted-text">·</span>
                    <span className="text-muted-text">{pctError}% err</span>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-text font-light">Loading forecast...</p>
        )}
      </Card>

      <Card title={`7D History & 7D ${label} Forecast`}>
        {forecastSeries.length > 0 ? (
          <>
            <div className="flex items-end gap-0.5 h-14 mb-1.5">
              {historySeries.map((v, i) => {
                const val = v ?? scaleBounds.min;
                const pct = ((val - scaleBounds.min) / (scaleBounds.max - scaleBounds.min)) * 100;
                return (
                  <div
                    key={`h-${i}`}
                    title={`Hist -${7 - i}d: ${val.toFixed(1)} ${unit}`}
                    style={{ height: `${Math.min(Math.max(pct, 6), 100)}%` }}
                    className="flex-1 rounded-t-sm bg-primary-accent/40"
                  />
                );
              })}
              <div className="w-px h-full bg-white/25 mx-0.5" />
              {forecastSeries.map((v, i) => {
                const val = v ?? scaleBounds.min;
                const pct = ((val - scaleBounds.min) / (scaleBounds.max - scaleBounds.min)) * 100;
                const simV = simSeries[i];
                const simPct =
                  simV !== null && simV !== undefined
                    ? ((simV - scaleBounds.min) / (scaleBounds.max - scaleBounds.min)) * 100
                    : null;
                const isActive = i === leadDay;

                return (
                  <div key={`f-${i}`} className="flex-1 h-full flex items-end gap-[1px]">
                    <div
                      title={`Base D+${i + 1}: ${val.toFixed(1)} ${unit}`}
                      style={{ height: `${Math.min(Math.max(pct, 6), 100)}%` }}
                      className={`flex-1 rounded-t-sm transition-all ${
                        isActive ? "bg-secondary-accent" : "bg-primary-accent/80"
                      }`}
                    />
                    {simPct !== null && (
                      <div
                        title={`Sim D+${i + 1}: ${simV!.toFixed(1)} ${unit}`}
                        style={{ height: `${Math.min(Math.max(simPct, 6), 100)}%` }}
                        className="flex-1 rounded-t-sm bg-amber-400"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between font-mono text-[8px] text-muted-text">
              <span>-7d Hist</span>
              <span>D+1..D+7</span>
            </div>
            {simSeries.length > 0 && (
              <div className="flex items-center gap-3 mt-1.5 font-mono text-[8px] text-muted-text">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-secondary-accent inline-block rounded-xs" /> Baseline
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-400 inline-block rounded-xs" /> What-If Sim
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-text font-light">No series data</p>
        )}
      </Card>

      <Card title="What-If Sensitivity Output">
        <StatRow
          label="Input Rain Δ"
          value={`${rainfallDelta >= 0 ? "+" : ""}${rainfallDelta} mm`}
          valueClass={rainfallDelta !== 0 ? "text-amber-400" : "text-muted-text"}
        />
        <StatRow
          label="Input Tmax / Tmin Δ"
          value={`${tmaxDelta >= 0 ? "+" : ""}${tmaxDelta.toFixed(1)} / ${tminDelta >= 0 ? "+" : ""}${tminDelta.toFixed(1)} °C`}
          valueClass={tmaxDelta !== 0 || tminDelta !== 0 ? "text-amber-400" : "text-muted-text"}
        />
        <StatRow
          label={`Simulated ${label}`}
          value={simVal !== null ? `${simVal.toFixed(2)} ${unit}` : "—"}
          valueClass="text-secondary-accent"
        />
        <StatRow
          label="Model Sensitivity Δ"
          value={
            simDiff !== null
              ? `${simDiff >= 0 ? "+" : ""}${simDiff.toFixed(2)} ${unit}`
              : "—"
          }
          valueClass={
            simDiff !== null
              ? simDiff >= 0
                ? "text-amber-300"
                : "text-blue-300"
              : "text-muted-text"
          }
        />
        <p className="text-[9px] text-muted-text/80 mt-2 leading-relaxed">
          Model sensitivity analysis: shows ClimateDualNet&apos;s learned response to perturbed 30-day inputs, not a physical projection.
        </p>
      </Card>
    </div>
  );
}
