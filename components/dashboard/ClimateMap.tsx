"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Variable,
  OverlayMode,
  ForecastResponse,
  SimulateResponse,
} from "@/lib/climateTypes";

const SCALES: Record<Variable, { min: number; max: number; stops: string[] }> = {
  rain: {
    min: 0,
    max: 80,
    stops: ["#EFF6FB", "#C8DFF0", "#7AAABB", "#2A7FAF", "#14506E", "#0D2D3D"],
  },
  tmax: {
    min: 24,
    max: 40,
    stops: ["#FEF9C3", "#FCD34D", "#F97316", "#EF4444", "#991B1B"],
  },
  tmin: {
    min: 15,
    max: 28,
    stops: ["#F3E8FF", "#D8B4FE", "#A78BFA", "#7C3AED", "#4C1D95"],
  },
};

const ANOMALY_SCALE: Record<Variable, { min: number; max: number; stops: string[] }> = {
  rain: {
    min: -30,
    max: 30,
    stops: ["#1E3A8A", "#60A5FA", "#F8FAFC", "#F97316", "#991B1B"],
  },
  tmax: {
    min: -5,
    max: 5,
    stops: ["#1E3A8A", "#60A5FA", "#F8FAFC", "#F97316", "#991B1B"],
  },
  tmin: {
    min: -5,
    max: 5,
    stops: ["#1E3A8A", "#60A5FA", "#F8FAFC", "#F97316", "#991B1B"],
  },
};

const UNITS: Record<Variable, string> = { rain: "mm/day", tmax: "°C", tmin: "°C" };
const LABELS: Record<Variable, string> = { rain: "Rainfall", tmax: "Max Temp", tmin: "Min Temp" };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexToRgb(hex: string) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function interpolateColor(stops: string[], t: number): string {
  const clamped = Math.min(Math.max(t, 0), 1);
  const scaled = clamped * (stops.length - 1);
  const lo = Math.floor(scaled);
  const hi = Math.min(lo + 1, stops.length - 1);
  const frac = scaled - lo;
  const [r1, g1, b1] = hexToRgb(stops[lo]);
  const [r2, g2, b2] = hexToRgb(stops[hi]);
  return `rgb(${Math.round(lerp(r1, r2, frac))},${Math.round(lerp(g1, g2, frac))},${Math.round(
    lerp(b1, b2, frac)
  )})`;
}

function getColor(value: number, variable: Variable, mode: OverlayMode): string {
  if (mode === "anomaly" || mode === "whatif") {
    const { min, max, stops } = ANOMALY_SCALE[variable];
    return interpolateColor(stops, (value - min) / (max - min));
  }
  const { min, max, stops } = SCALES[variable];
  return interpolateColor(stops, (value - min) / (max - min));
}

interface TooltipState {
  x: number;
  y: number;
  lat: number;
  lon: number;
  primary: number;
  secondaryLabel?: string;
  secondaryValue?: number;
}

function GridLayer({
  variable,
  mode,
  forecastData,
  simData,
  selectedCoords,
  onSelectCoords,
  onTooltip,
}: {
  variable: Variable;
  mode: OverlayMode;
  forecastData: ForecastResponse | null;
  simData: SimulateResponse | null;
  selectedCoords: { r: number; c: number } | null;
  onSelectCoords: (coords: { r: number; c: number }) => void;
  onTooltip: (t: TooltipState | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!forecastData) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    const layers: any[] = [];

    const simMap = new Map<string, (typeof simData extends null ? never : NonNullable<typeof simData>["grid"][number])>();
    if (simData) {
      simData.grid.forEach((cell) => simMap.set(`${cell.r},${cell.c}`, cell));
    }

    forecastData.grid.forEach((cell) => {
      const actualVal = cell.actual[variable];
      const predVal = cell.predicted[variable] ?? 0;
      const simCell = simMap.get(`${cell.r},${cell.c}`);

      let displayValue = predVal;
      let secondaryLabel: string | undefined;
      let secondaryValue: number | undefined;

      if (mode === "actual") {
        if (actualVal === null) return;
        displayValue = actualVal;
        secondaryLabel = "Predicted";
        secondaryValue = predVal;
      } else if (mode === "predicted") {
        displayValue = predVal;
        if (actualVal !== null) {
          secondaryLabel = "Actual";
          secondaryValue = actualVal;
        }
      } else if (mode === "anomaly") {
        if (actualVal === null) return;
        displayValue = predVal - actualVal;
        secondaryLabel = "Predicted";
        secondaryValue = predVal;
      } else if (mode === "whatif" && simCell) {
        displayValue = simCell.delta[variable] ?? 0;
        secondaryLabel = "Simulated";
        secondaryValue = simCell.simulated[variable] ?? predVal;
      }

      const color = getColor(displayValue, variable, mode);
      const isSelected =
        selectedCoords !== null &&
        selectedCoords.r === cell.r &&
        selectedCoords.c === cell.c;

      const rect = L.rectangle(
        [
          [cell.lat - 0.125, cell.lon - 0.125],
          [cell.lat + 0.125, cell.lon + 0.125],
        ],
        {
          color: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.12)",
          fillColor: color,
          fillOpacity: isSelected ? 0.85 : 0.62,
          weight: isSelected ? 2 : 0.5,
        }
      );

      rect.on("mouseover", (e: any) => {
        rect.setStyle({ fillOpacity: 0.9, weight: 1.5, color: "#FFFFFF" });
        onTooltip({
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
          lat: cell.lat,
          lon: cell.lon,
          primary: displayValue,
          secondaryLabel,
          secondaryValue,
        });
      });

      rect.on("mousemove", (e: any) => {
        onTooltip({
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
          lat: cell.lat,
          lon: cell.lon,
          primary: displayValue,
          secondaryLabel,
          secondaryValue,
        });
      });

      rect.on("mouseout", () => {
        rect.setStyle({
          fillOpacity: isSelected ? 0.85 : 0.62,
          weight: isSelected ? 2 : 0.5,
          color: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.12)",
        });
        onTooltip(null);
      });

      rect.on("click", () => {
        onSelectCoords({ r: cell.r, c: cell.c });
      });

      rect.addTo(map);
      layers.push(rect);
    });

    return () => {
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [variable, mode, forecastData, simData, selectedCoords, map, onSelectCoords, onTooltip]);

  return null;
}

function Legend({ variable, mode }: { variable: Variable; mode: OverlayMode }) {
  const isDiff = mode === "anomaly" || mode === "whatif";
  const { min, max, stops } = isDiff ? ANOMALY_SCALE[variable] : SCALES[variable];

  const title =
    mode === "anomaly"
      ? "Anomaly (Pred − Actual)"
      : mode === "whatif"
      ? "What-If Δ (Sim − Base)"
      : `${LABELS[variable]} (${UNITS[variable]})`;

  return (
    <div className="absolute bottom-4 left-3 z-[1000] bg-[#0D1B2A]/90 border border-primary-accent/30 rounded-sm px-3 py-2 shadow-md backdrop-blur-sm">
      <p className="font-mono text-[8px] tracking-[0.15em] uppercase text-secondary-accent mb-1.5">
        {title}
      </p>
      <div
        className="w-36 h-1.5 rounded-full mb-1"
        style={{ background: `linear-gradient(to right, ${stops.join(",")})` }}
      />
      <div className="flex justify-between font-mono text-[8px] text-secondary-text">
        <span>{min}</span>
        <span>{Math.round((min + max) / 2)}</span>
        <span>{isDiff ? `+${max}` : `${max}+`}</span>
      </div>
    </div>
  );
}

interface Props {
  variable: Variable;
  date: string;
  forecastDate: string;
  mode: OverlayMode;
  setMode: (m: OverlayMode) => void;
  forecastData: ForecastResponse | null;
  simData: SimulateResponse | null;
  selectedCoords: { r: number; c: number } | null;
  onSelectCoords: (coords: { r: number; c: number }) => void;
  loading: boolean;
}

export default function ClimateMap({
  variable,
  date,
  forecastDate,
  mode,
  setMode,
  forecastData,
  simData,
  selectedCoords,
  onSelectCoords,
  loading,
}: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const handleTooltip = useCallback((t: TooltipState | null) => setTooltip(t), []);

  const MODES: { key: OverlayMode; label: string; disabled?: boolean }[] = [
    { key: "actual", label: "Actual" },
    { key: "predicted", label: "Predicted" },
    { key: "anomaly", label: "Δ Anomaly" },
    { key: "whatif", label: "What-If Δ", disabled: !simData },
  ];

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-3 left-14 z-[1000] flex flex-wrap gap-1.5">
        {MODES.map(({ key, label, disabled }) => (
          <button
            key={key}
            disabled={disabled}
            onClick={() => setMode(key)}
            className={`font-mono text-[9px] shadow-md tracking-[0.1em] uppercase px-2.5 py-1 rounded-sm border transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
              ${
                mode === key
                  ? "bg-[#14506E] text-white border-[#4AADDB]"
                  : "bg-[#0D1B2A]/90 text-secondary-accent border-primary-accent/30 hover:border-secondary-accent"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="absolute top-3 right-3 z-[1000] bg-[#0D1B2A]/90 border border-primary-accent/30 rounded-sm px-2.5 py-1 flex items-center gap-2">
        {loading && (
          <span className="w-1.5 h-1.5 rounded-full bg-secondary-accent animate-ping" />
        )}
        <p className="font-mono text-[9px] tracking-[0.08em] text-secondary-accent">
          Target: {forecastDate || date}
        </p>
      </div>

      <Legend variable={variable} mode={mode} />

      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none bg-[#0D1B2A]/95 border border-primary-accent/40 rounded-sm px-3 py-2 shadow-lg"
          style={{ left: tooltip.x + 14, top: tooltip.y - 56 }}
        >
          <p className="font-mono text-[9px] text-muted-text mb-0.5">
            {tooltip.lat.toFixed(2)}°N · {tooltip.lon.toFixed(2)}°E
          </p>
          <p className="font-mono text-xs font-semibold text-secondary-accent">
            {mode === "anomaly" || mode === "whatif"
              ? `${tooltip.primary >= 0 ? "+" : ""}${tooltip.primary.toFixed(2)}`
              : tooltip.primary.toFixed(2)}{" "}
            {UNITS[variable]}
          </p>
          {tooltip.secondaryLabel && tooltip.secondaryValue !== undefined && (
            <p className="font-mono text-[9px] text-muted-text mt-0.5">
              {tooltip.secondaryLabel}: {tooltip.secondaryValue.toFixed(2)} {UNITS[variable]}
            </p>
          )}
        </div>
      )}

      <MapContainer
        center={[10.5, 76.0]}
        zoom={7}
        style={{ height: "100%", width: "100%", background: "#0D1B2A" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <GridLayer
          variable={variable}
          mode={mode}
          forecastData={forecastData}
          simData={simData}
          selectedCoords={selectedCoords}
          onSelectCoords={onSelectCoords}
          onTooltip={handleTooltip}
        />
      </MapContainer>
    </div>
  );
}
