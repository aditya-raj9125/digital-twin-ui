"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Variable } from "@/app/dashboard/page";

export type OverlayMode = "actual" | "predicted" | "anomaly";

export interface GridPoint {
  lat: number;
  lon: number;
  actual: number;
  predicted: number;
}

export interface SelectedPoint {
  lat: number;
  lon: number;
  actual: number;
  predicted: number;
  history: number[];
}

const SCALES: Record<Variable, { min: number; max: number; stops: string[] }> = {
  rain: {
    min: 0, max: 80,
    stops: ["#EFF6FB", "#C8DFF0", "#7AAABB", "#2A7FAF", "#14506E", "#0D2D3D"],
  },
  tmax: {
    min: 28, max: 42,
    stops: ["#FEF9C3", "#FCD34D", "#F97316", "#EF4444", "#991B1B"],
  },
  tmin: {
    min: 15, max: 30,
    stops: ["#EFF6FF", "#BFDBFE", "#60A5FA", "#2A7FAF", "#1E3A8A"],
  },
};

const ANOMALY_SCALE = {
  stops: ["#1E3A8A", "#60A5FA", "#F8FAFC", "#F97316", "#991B1B"],
  min: -20, max: 20,
};

const UNITS: Record<Variable, string> = { rain: "mm/day", tmax: "°C", tmin: "°C" };
const LABELS: Record<Variable, string> = { rain: "Rainfall", tmax: "Max Temp", tmin: "Min Temp" };

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function hexToRgb(hex: string) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function interpolateColor(stops: string[], t: number): string {
  const clamped = Math.min(Math.max(t, 0), 1);
  const scaled  = clamped * (stops.length - 1);
  const lo      = Math.floor(scaled);
  const hi      = Math.min(lo + 1, stops.length - 1);
  const frac    = scaled - lo;
  const [r1, g1, b1] = hexToRgb(stops[lo]);
  const [r2, g2, b2] = hexToRgb(stops[hi]);
  return `rgb(${Math.round(lerp(r1,r2,frac))},${Math.round(lerp(g1,g2,frac))},${Math.round(lerp(b1,b2,frac))})`;
}

function getColor(value: number, variable: Variable, mode: OverlayMode, actual?: number): string {
  if (mode === "anomaly" && actual !== undefined) {
    const t = (value - actual - ANOMALY_SCALE.min) / (ANOMALY_SCALE.max - ANOMALY_SCALE.min);
    return interpolateColor(ANOMALY_SCALE.stops, t);
  }
  const { min, max, stops } = SCALES[variable];
  return interpolateColor(stops, (value - min) / (max - min));
}

function generateMockGrid(variable: Variable): GridPoint[] {
  const { min, max } = SCALES[variable];
  const points: GridPoint[] = [];
  for (let lat = 28.0; lat <= 29.5; lat += 0.25) {
    for (let lon = 76.5; lon <= 78.0; lon += 0.25) {
      const actual    = min + Math.random() * (max - min);
      const predicted = Math.max(min, Math.min(max, actual + (Math.random() - 0.5) * (max - min) * 0.2));
      points.push({ lat, lon, actual, predicted });
    }
  }
  return points;
}

function generateMockHistory(variable: Variable): number[] {
  const { min, max } = SCALES[variable];
  return Array.from({ length: 7 }, () => min + Math.random() * (max - min));
}

interface TooltipState {
  x: number;
  y: number;
  lat: number;
  lon: number;
  value: number;
}

function GridLayer({ variable, mode, onPointSelect, onTooltip }: {
  variable: Variable;
  mode: OverlayMode;
  onPointSelect: (p: SelectedPoint) => void;
  onTooltip: (t: TooltipState | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const L = require("leaflet");
    const grid = generateMockGrid(variable);
    const layers: any[] = [];

    grid.forEach(({ lat, lon, actual, predicted }) => {
      const displayValue = mode === "actual" ? actual : predicted;
      const color = getColor(displayValue, variable, mode, actual);

      const rect = L.rectangle(
        [[lat, lon], [lat + 0.25, lon + 0.25]],
        { color: "transparent", fillColor: color, fillOpacity: 0.65, weight: 0 }
      );

      rect.on("mouseover", (e: any) => {
        rect.setStyle({ fillOpacity: 0.88 });
        onTooltip({
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
          lat, lon,
          value: displayValue,
        });
      });

      rect.on("mousemove", (e: any) => {
        onTooltip({
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
          lat, lon,
          value: displayValue,
        });
      });

      rect.on("mouseout", () => {
        rect.setStyle({ fillOpacity: 0.65 });
        onTooltip(null);
      });

      rect.on("click", () => {
        onPointSelect({
          lat, lon,
          actual, predicted,
          history: generateMockHistory(variable),
        });
      });

      rect.addTo(map);
      layers.push(rect);
    });

    return () => { layers.forEach(l => map.removeLayer(l)); };
  }, [variable, mode, map, onPointSelect, onTooltip]);

  return null;
}

function Legend({ variable, mode }: { variable: Variable; mode: OverlayMode }) {
  const isAnomaly = mode === "anomaly";
  const { min, max, stops } = isAnomaly
    ? { min: ANOMALY_SCALE.min, max: ANOMALY_SCALE.max, stops: ANOMALY_SCALE.stops }
    : SCALES[variable];

  return (
    <div className="absolute bottom-4 left-3 z-[1000] bg-white/90 border border-blue-200 rounded-sm px-3 py-2 shadow-sm">
      <p className="font-mono text-[8px] tracking-[0.15em] uppercase text-[#14506E] mb-1.5">
        {isAnomaly ? "Anomaly (Predicted − Actual)" : `${LABELS[variable]} (${UNITS[variable]})`}
      </p>
      <div
        className="w-32 h-1.5 rounded-full mb-1"
        style={{ background: `linear-gradient(to right, ${stops.join(",")})` }}
      />
      <div className="flex justify-between font-mono text-[8px] text-[#2A7FAF]">
        <span>{isAnomaly ? min : min}</span>
        <span>{Math.round((min + max) / 2)}</span>
        <span>{isAnomaly ? `+${max}` : `${max}+`}</span>
      </div>
    </div>
  );
}

interface Props {
  variable: Variable;
  date: string;
  onPointSelect: (p: SelectedPoint) => void;
}

export default function ClimateMap({ variable, date, onPointSelect }: Props) {
  const [mode, setMode]       = useState<OverlayMode>("actual");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const handleTooltip = useCallback((t: TooltipState | null) => setTooltip(t), []);
  const handleSelect  = useCallback((p: SelectedPoint) => onPointSelect(p), [onPointSelect]);

  const MODES: { key: OverlayMode; label: string }[] = [
    { key: "actual",    label: "Actual"    },
    { key: "predicted", label: "Predicted" },
    { key: "anomaly",   label: "Δ Anomaly" },
  ];

  return (
    <div className="relative w-full h-full">

      <div className="absolute top-3 left-15 z-[1000] flex gap-1.5">
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`font-mono text-[9px] shadow-md shadow-bg-primary tracking-[0.1em] uppercase px-2.5 py-1 rounded-sm border transition-all duration-200
              ${mode === key
                ? "bg-[#14506E] text-white border-[#14506E]"
                : "bg-white/85 text-[#2A7FAF] border-blue-200 hover:border-[#2A7FAF]"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="absolute top-3 right-3 z-[1000] bg-white/90 border border-blue-200 rounded-sm px-2.5 py-1">
        <p className="font-mono text-[9px] tracking-[0.1em] text-[#14506E]">{date}</p>
      </div>

      <Legend variable={variable} mode={mode} />

      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none bg-white/95 border border-blue-200 rounded-sm px-3 py-2 shadow-md"
          style={{ left: tooltip.x + 14, top: tooltip.y - 52 }}
        >
          <p className="font-mono text-[9px] text-[#8A9BAA] mb-0.5">
            {tooltip.lat.toFixed(2)}°N · {tooltip.lon.toFixed(2)}°E
          </p>
          <p className="font-mono text-xs font-semibold text-[#14506E]">
            {tooltip.value.toFixed(1)} {UNITS[variable]}
          </p>
        </div>
      )}

      <MapContainer
        center={[28.7041, 77.1025]}
        zoom={7}
        style={{ height: "100%", width: "100%", background: "#0D1B2A" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://stadiomaps.com/">stadio</a>'
        />
        <GridLayer
          variable={variable}
          mode={mode}
          onPointSelect={handleSelect}
          onTooltip={handleTooltip}
        />
      </MapContainer>

    </div>
  );
}
