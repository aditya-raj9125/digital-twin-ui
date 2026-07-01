"use client";

import { Variable } from "@/app/dashboard/page";

const VARIABLES: { key: Variable; label: string; color: string }[] = [
  { key: "rain",  label: "Rainfall",  color: "#4AADDB" },
  { key: "tmax",  label: "Max Temp",  color: "#F59E0B" },
  { key: "tmin",  label: "Min Temp",  color: "#4C1D95" },
];

interface Props {
  variable: Variable;
  setVariable: (v: Variable) => void;
  rainfallDelta: number;
  setRainfallDelta: (v: number) => void;
  tempDelta: number;
  setTempDelta: (v: number) => void;
}
function getRangeBackground(value: number, min: number, max: number) {
  const center = (max + min) / 2; // 0 for -50 to 50
  const centerPct = ((center - min) / (max - min)) * 100;
  const valuePct  = ((value - min) / (max - min)) * 100;

  const left  = Math.min(centerPct, valuePct);
  const right = Math.max(centerPct, valuePct);

  return `linear-gradient(to right,
    #1E3448 0%,
    #1E3448 ${left}%,
    #4AADDB ${left}%,
    #4AADDB ${right}%,
    #1E3448 ${right}%,
    #1E3448 100%
  )`;
}
export default function DashboardSidebar({
  variable, setVariable,
  rainfallDelta, setRainfallDelta,
  tempDelta, setTempDelta,
}: Props) {
  return (
    <div className="w-[200px] max-lg:w-12 h-full bg-[#0D1B2A] border-r border-primary-accent/15 flex flex-col gap-6 px-3 py-3 overflow-y-auto">

      <div className="w-full">
        <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-primary-accent mb-2 max-lg:hidden">
          Variable
        </p>
        <div className="flex flex-col gap-1">
          {VARIABLES.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setVariable(key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-left transition-all duration-200 border max-lg:justify-center max-lg:px-2
                ${variable === key
                  ? "bg-primary-accent/15 border-primary-accent/40 text-secondary-accent"
                  : "border-transparent text-muted-text hover:bg-[#1E3448] hover:text-secondary-text"
                }`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-sm max-lg:hidden">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-primary-accent/10 max-lg:hidden" />

      <div className="w-full max-lg:hidden">
        <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-primary-accent mb-3">
          What-If Scenario
        </p>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-secondary-text">Rainfall Δ</span>
              <span className="font-mono text-[10px] text-secondary-accent">
                {rainfallDelta >= 0 ? "+" : ""}{rainfallDelta} mm
              </span>
            </div>
            <input
              type="range" min={-50} max={50} value={rainfallDelta}
              onChange={(e) => setRainfallDelta(Number(e.target.value))}
              style={{ background: getRangeBackground(rainfallDelta, -50, 50) }}
              className="w-full accent-secondary-accent cursor-pointer"
              onMouseEnter={(e) => e.currentTarget.classList.add("thumb-hover")}
              onMouseLeave={(e) => e.currentTarget.classList.remove("thumb-hover")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-secondary-text">Temperature Δ</span>
              <span className="font-mono text-[10px] text-secondary-accent">
                {tempDelta >= 0 ? "+" : ""}{tempDelta} °C
              </span>
            </div>
            <input
              type="range" min={-10} max={10} value={tempDelta}
              onChange={(e) => setTempDelta(Number(e.target.value))}
              style={{ background: getRangeBackground(tempDelta, -10, 10) }}
              className="w-full accent-secondary-accent cursor-pointer"
              onMouseEnter={(e) => e.currentTarget.classList.add("thumb-hover")}
              onMouseLeave={(e) => e.currentTarget.classList.remove("thumb-hover")}
            />
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-1.5 mt-auto max-lg:hidden">
        <button className="w-full py-2 bg-primary-accent text-primary-bg text-sm font-medium rounded-sm hover:bg-secondary-accent transition-colors">
          Run Simulation
        </button>
        <button className="w-full py-2 bg-transparent text-muted-text border border-primary-accent/20 text-sm rounded-sm hover:border-primary-accent hover:text-secondary-accent transition-colors">
          Reset
        </button>
      </div>

    </div>
  );
}
