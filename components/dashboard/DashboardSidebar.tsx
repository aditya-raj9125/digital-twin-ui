"use client";

import { Variable } from "@/lib/climateTypes";
import { BarChart3, RotateCcw, Play, Loader2 } from "lucide-react";

const VARIABLES: { key: Variable; label: string; color: string }[] = [
  { key: "rain", label: "Rainfall", color: "#4AADDB" },
  { key: "tmax", label: "Max Temp", color: "#F59E0B" },
  { key: "tmin", label: "Min Temp", color: "#A78BFA" },
];

const SCENARIO_PRESETS = [
  { label: "Extreme Monsoon", rain: 40, tmax: -1, tmin: 0 },
  { label: "Heatwave", rain: -15, tmax: 4.5, tmin: 3.0 },
  { label: "Dry Spell", rain: -25, tmax: 2.0, tmin: 1.0 },
  { label: "Warm & Wet", rain: 25, tmax: 2.5, tmin: 2.5 },
];

interface Props {
  variable: Variable;
  setVariable: (v: Variable) => void;
  rainfallDelta: number;
  setRainfallDelta: (v: number) => void;
  tmaxDelta: number;
  setTmaxDelta: (v: number) => void;
  tminDelta: number;
  setTminDelta: (v: number) => void;
  onRunSimulation: () => void;
  onResetSimulation: () => void;
  simLoading: boolean;
  hasSimulation: boolean;
  onOpenDiagnostics: () => void;
}

function getRangeBackground(value: number, min: number, max: number) {
  const centerPct = ((0 - min) / (max - min)) * 100;
  const valuePct = ((value - min) / (max - min)) * 100;
  const left = Math.min(centerPct, valuePct);
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
  variable,
  setVariable,
  rainfallDelta,
  setRainfallDelta,
  tmaxDelta,
  setTmaxDelta,
  tminDelta,
  setTminDelta,
  onRunSimulation,
  onResetSimulation,
  simLoading,
  hasSimulation,
  onOpenDiagnostics,
}: Props) {
  const hasDeltas = rainfallDelta !== 0 || tmaxDelta !== 0 || tminDelta !== 0;

  return (
    <div className="w-[220px] max-lg:w-12 h-full bg-[#0D1B2A] border-r border-primary-accent/15 flex flex-col gap-5 px-3 py-3 overflow-y-auto">
      <div className="w-full">
        <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-primary-accent mb-2 max-lg:hidden">
          Variable
        </p>
        <div className="flex flex-col gap-1">
          {VARIABLES.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setVariable(key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-sm text-left transition-all duration-200 border max-lg:justify-center max-lg:px-2 cursor-pointer
                ${
                  variable === key
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
        <div className="flex items-center justify-between mb-2">
          <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-primary-accent">
            What-If Simulator
          </p>
          {hasSimulation && (
            <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-green-400/15 text-green-300 border border-green-400/30">
              Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1 mb-4">
          {SCENARIO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setRainfallDelta(preset.rain);
                setTmaxDelta(preset.tmax);
                setTminDelta(preset.tmin);
              }}
              className="font-mono text-[8px] text-left px-2 py-1 rounded-sm bg-[#132538] border border-primary-accent/15 text-secondary-text hover:border-primary-accent/45 hover:text-secondary-accent transition-colors cursor-pointer truncate"
              title={`Rain ${preset.rain >= 0 ? "+" : ""}${preset.rain}mm, Tmax ${preset.tmax >= 0 ? "+" : ""}${preset.tmax}°C`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-secondary-text">Rainfall Δ</span>
              <span className="font-mono text-[10px] text-secondary-accent">
                {rainfallDelta >= 0 ? "+" : ""}
                {rainfallDelta} mm
              </span>
            </div>
            <input
              type="range"
              min={-50}
              max={100}
              step={1}
              value={rainfallDelta}
              onChange={(e) => setRainfallDelta(Number(e.target.value))}
              style={{ background: getRangeBackground(rainfallDelta, -50, 100) }}
              className="w-full accent-secondary-accent cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-secondary-text">Tmax Δ</span>
              <span className="font-mono text-[10px] text-amber-400">
                {tmaxDelta >= 0 ? "+" : ""}
                {tmaxDelta.toFixed(1)} °C
              </span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.5}
              value={tmaxDelta}
              onChange={(e) => setTmaxDelta(Number(e.target.value))}
              style={{ background: getRangeBackground(tmaxDelta, -10, 10) }}
              className="w-full accent-secondary-accent cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-secondary-text">Tmin Δ</span>
              <span className="font-mono text-[10px] text-purple-300">
                {tminDelta >= 0 ? "+" : ""}
                {tminDelta.toFixed(1)} °C
              </span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.5}
              value={tminDelta}
              onChange={(e) => setTminDelta(Number(e.target.value))}
              style={{ background: getRangeBackground(tminDelta, -10, 10) }}
              className="w-full accent-secondary-accent cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-1.5 mt-auto max-lg:hidden">
        <button
          onClick={onRunSimulation}
          disabled={simLoading}
          className="w-full py-2 bg-primary-accent text-primary-bg text-xs font-semibold rounded-sm hover:bg-secondary-accent transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
        >
          {simLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Running Model...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Run What-If Model
            </>
          )}
        </button>

        <button
          onClick={onResetSimulation}
          disabled={!hasDeltas && !hasSimulation}
          className="w-full py-1.5 bg-transparent text-muted-text border border-primary-accent/20 text-xs rounded-sm hover:border-primary-accent hover:text-secondary-accent transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>

        <button
          onClick={onOpenDiagnostics}
          className="w-full py-1.5 mt-1 bg-[#132538] text-secondary-text border border-primary-accent/15 text-xs rounded-sm hover:border-primary-accent/40 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <BarChart3 className="w-3.5 h-3.5 text-secondary-accent" />
          2025 Plots &amp; Metrics
        </button>
      </div>
    </div>
  );
}
