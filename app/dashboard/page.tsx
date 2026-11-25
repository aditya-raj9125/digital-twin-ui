"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import DashboardRightPanel from "@/components/dashboard/DashboardRightPanel";
import DashboardTimebar from "@/components/dashboard/DashboardTimebar";
import DiagnosticsModal from "@/components/dashboard/DiagnosticsModal";
import {
  ForecastResponse,
  OverlayMode,
  SimulateResponse,
  Variable,
} from "@/lib/climateTypes";

const ClimateMap = dynamic(() => import("@/components/dashboard/ClimateMap"), {
  ssr: false,
});

export default function DashboardPage() {
  const [variable, setVariable] = useState<Variable>("rain");
  const [date, setDate] = useState("2025-06-15");
  const [leadDay, setLeadDay] = useState(0);
  const [mode, setMode] = useState<OverlayMode>("predicted");

  const [rainfallDelta, setRainfallDelta] = useState(0);
  const [tmaxDelta, setTmaxDelta] = useState(0);
  const [tminDelta, setTminDelta] = useState(0);

  const [selectedCoords, setSelectedCoords] = useState<{ r: number; c: number } | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [simData, setSimData] = useState<SimulateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [modelOnline, setModelOnline] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    fetch("/api/model/health")
      .then((r) => (r.ok ? setModelOnline(true) : setModelOnline(false)))
      .catch(() => setModelOnline(false));
  }, []);

  // Fetch live ClimateDualNet forecast whenever date or leadDay changes
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/model/forecast?date=${encodeURIComponent(date)}&lead_day=${leadDay}`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error("Forecast error");
        return r.json();
      })
      .then((data: ForecastResponse) => {
        setForecastData(data);
        setModelOnline(true);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setModelOnline(false);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [date, leadDay]);

  const runSimulation = useCallback(async () => {
    setSimLoading(true);
    try {
      const res = await fetch("/api/model/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          rainfall_delta: rainfallDelta,
          tmax_delta: tmaxDelta,
          tmin_delta: tminDelta,
          lead_day: leadDay,
        }),
      });
      if (!res.ok) throw new Error("Simulation failed");
      const data: SimulateResponse = await res.json();
      setSimData(data);
      setMode("whatif");
    } catch {
      // Keep existing state on error
    } finally {
      setSimLoading(false);
    }
  }, [date, rainfallDelta, tmaxDelta, tminDelta, leadDay]);

  const resetSimulation = useCallback(() => {
    setRainfallDelta(0);
    setTmaxDelta(0);
    setTminDelta(0);
    setSimData(null);
    if (mode === "whatif") setMode("predicted");
  }, [mode]);

  const selectedCell = useMemo(() => {
    if (!forecastData || !selectedCoords) return null;
    return (
      forecastData.grid.find(
        (g) => g.r === selectedCoords.r && g.c === selectedCoords.c
      ) ?? null
    );
  }, [forecastData, selectedCoords]);

  const selectedSimCell = useMemo(() => {
    if (!simData || !selectedCoords) return null;
    return (
      simData.grid.find(
        (g) => g.r === selectedCoords.r && g.c === selectedCoords.c
      ) ?? null
    );
  }, [simData, selectedCoords]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <div className="flex-none">
        <DashboardTopbar
          date={date}
          forecastDate={forecastData?.forecast_date}
          split={forecastData?.split}
          modelOnline={modelOnline}
          onOpenDiagnostics={() => setDiagnosticsOpen(true)}
        />
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-none h-full">
          <DashboardSidebar
            variable={variable}
            setVariable={setVariable}
            rainfallDelta={rainfallDelta}
            setRainfallDelta={setRainfallDelta}
            tmaxDelta={tmaxDelta}
            setTmaxDelta={setTmaxDelta}
            tminDelta={tminDelta}
            setTminDelta={setTminDelta}
            onRunSimulation={runSimulation}
            onResetSimulation={resetSimulation}
            simLoading={simLoading}
            hasSimulation={simData !== null}
            onOpenDiagnostics={() => setDiagnosticsOpen(true)}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 min-h-0">
            <ClimateMap
              variable={variable}
              date={date}
              forecastDate={forecastData?.forecast_date || date}
              mode={mode}
              setMode={setMode}
              forecastData={forecastData}
              simData={simData}
              selectedCoords={selectedCoords}
              onSelectCoords={setSelectedCoords}
              loading={loading}
            />
          </div>
          <div className="flex-none">
            <DashboardTimebar
              date={date}
              setDate={setDate}
              leadDay={leadDay}
              setLeadDay={setLeadDay}
            />
          </div>
        </div>

        <div className="flex-none h-full hidden lg:block">
          <DashboardRightPanel
            selectedCell={selectedCell}
            selectedSimCell={selectedSimCell}
            forecastData={forecastData}
            simData={simData}
            variable={variable}
            date={date}
            leadDay={leadDay}
            rainfallDelta={rainfallDelta}
            tmaxDelta={tmaxDelta}
            tminDelta={tminDelta}
          />
        </div>
      </div>

      <div className="flex-none lg:hidden">
        <DashboardRightPanel
          selectedCell={selectedCell}
          selectedSimCell={selectedSimCell}
          forecastData={forecastData}
          simData={simData}
          variable={variable}
          date={date}
          leadDay={leadDay}
          rainfallDelta={rainfallDelta}
          tmaxDelta={tmaxDelta}
          tminDelta={tminDelta}
        />
      </div>

      <DiagnosticsModal
        open={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
      />
    </div>
  );
}
