import { Variable } from "@/app/dashboard/page";
import { SelectedPoint } from "@/components/dashboard/ClimateMap";

const UNITS: Record<Variable, string> = { rain: "mm/day", tmax: "°C", tmin: "°C" };
const LABELS: Record<Variable, string> = { rain: "Rainfall", tmax: "Max Temp", tmin: "Min Temp" };

interface Props {
  selectedPoint: SelectedPoint | null;
  variable: Variable;
  date: string;
  rainfallDelta: number;
  tempDelta: number;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1E3448] border border-primary-accent/15 rounded-sm p-3 flex-shrink-0">
      <p className="font-mono text-[8px] tracking-[0.18em] uppercase text-primary-accent mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function StatRow({ label, value, valueClass = "text-secondary-text" }: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-primary-accent/8 last:border-0">
      <span className="text-xs text-muted-text font-light">{label}</span>
      <span className={`font-mono text-xs ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function DashboardRightPanel({
  selectedPoint, variable, date, rainfallDelta, tempDelta,
}: Props) {
  const unit  = UNITS[variable];
  const label = LABELS[variable];
  const hasPoint = selectedPoint !== null;

  // Predicted vs actual values
  const actual    = hasPoint ? selectedPoint.actual    : null;
  const predicted = hasPoint ? selectedPoint.predicted : null;
  const delta     = actual !== null && predicted !== null
    ? (predicted - actual).toFixed(1)
    : null;
  const pctError  = actual !== null && predicted !== null && actual !== 0
    ? Math.abs(((predicted - actual) / actual) * 100).toFixed(0)
    : null;

  // Scenario output
  const scenarioPredicted = predicted !== null
    ? (predicted + rainfallDelta * 0.3 + tempDelta * 0.5).toFixed(1)
    : null;

  return (
    <div className="w-[260px] max-lg:w-full h-full bg-[#1A2E42] border-l border-primary-accent/15
      flex flex-col gap-3 px-3 py-4 overflow-y-auto
      max-lg:border-l-0 max-lg:border-t max-lg:flex-row max-lg:overflow-x-auto max-lg:h-auto">

      <Card title="Selected Point">
        {hasPoint ? (
          <>
            <StatRow label="Latitude"  value={`${selectedPoint.lat.toFixed(2)}°N`} />
            <StatRow label="Longitude" value={`${selectedPoint.lon.toFixed(2)}°E`} />
            <StatRow label="Date"      value={date} />
            <StatRow label="Variable"  value={label} />
          </>
        ) : (
          <p className="text-xs text-muted-text font-light">Click a point on the map</p>
        )}
      </Card>

      <Card title="Predicted vs Actual">
        {hasPoint && actual !== null && predicted !== null ? (
          <>
            <div className="grid grid-cols-[1fr_1px_1fr] gap-3 items-center">
              <div className="text-center">
                <p className="font-mono text-[8px] tracking-[0.12em] uppercase text-muted-text mb-1">Actual</p>
                <p className="font-display text-2xl font-semibold text-primary-text">{actual.toFixed(1)}</p>
                <p className="font-mono text-[9px] text-muted-text mt-0.5">{unit}</p>
              </div>
              <div className="h-full w-px bg-primary-accent/15" />
              <div className="text-center">
                <p className="font-mono text-[8px] tracking-[0.12em] uppercase text-muted-text mb-1">Predicted</p>
                <p className="font-display text-2xl font-semibold text-secondary-accent">{predicted.toFixed(1)}</p>
                <p className="font-mono text-[9px] text-muted-text mt-0.5">{unit}</p>
              </div>
            </div>
            {delta !== null && pctError !== null && (
              <div className="flex items-center justify-center gap-1.5 mt-3 font-mono text-[9px]">
                <span className={Number(delta) >= 0 ? "text-amber-400" : "text-green-400"}>
                  {Number(delta) >= 0 ? "▲" : "▼"} {Math.abs(Number(delta)).toFixed(1)} {unit}
                </span>
                <span className="text-muted-text">·</span>
                <span className="text-muted-text">{pctError}% error</span>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-text font-light">Select a point to compare</p>
        )}
      </Card>

      <Card title={`7-Day ${label} History`}>
        {hasPoint && selectedPoint.history.length > 0 ? (
          <>
            <div className="flex items-end gap-1 h-12 mb-2">
              {selectedPoint.history.map((v, i) => {
                const { min, max } = { rain: { min: 0, max: 80 }, tmax: { min: 28, max: 42 }, tmin: { min: 15, max: 30 } }[variable];
                const pct = ((v - min) / (max - min)) * 100;
                const isLast = i === selectedPoint.history.length - 1;
                return (
                  <div
                    key={i}
                    title={`${v.toFixed(1)} ${unit}`}
                    style={{ height: `${Math.max(pct, 8)}%` }}
                    className={`flex-1 rounded-t-sm transition-all duration-200 cursor-default
                      ${isLast ? "bg-secondary-accent opacity-100" : "bg-primary-accent opacity-60 hover:opacity-90"}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between font-mono text-[8px] text-muted-text">
              <span>-6 days</span>
              <span>today</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-text font-light">Select a point to view history</p>
        )}
      </Card>

      <Card title="Scenario Output">
        <StatRow
          label="Rainfall Δ"
          value={`${rainfallDelta >= 0 ? "+" : ""}${rainfallDelta} mm`}
          valueClass={rainfallDelta !== 0 ? "text-amber-400" : "text-muted-text"}
        />
        <StatRow
          label="Temp Δ"
          value={`${tempDelta >= 0 ? "+" : ""}${tempDelta} °C`}
          valueClass={tempDelta !== 0 ? "text-amber-400" : "text-muted-text"}
        />
        <StatRow
          label={`Scenario ${label}`}
          value={scenarioPredicted ? `${scenarioPredicted} ${unit}` : "—"}
          valueClass="text-secondary-accent"
        />
        <StatRow
          label="Status"
          value={rainfallDelta === 0 && tempDelta === 0 ? "Baseline" : "Run simulation"}
          valueClass="text-muted-text"
        />
      </Card>

    </div>
  );
}
