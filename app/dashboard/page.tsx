"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import DashboardRightPanel from "@/components/dashboard/DashboardRightPanel";
import DashboardTimebar from "@/components/dashboard/DashboardTimebar";
import { SelectedPoint } from "@/components/dashboard/ClimateMap";

const ClimateMap = dynamic(() => import("@/components/dashboard/ClimateMap"), { ssr: false });

export type Variable = "rain" | "tmax" | "tmin";

export default function DashboardPage() {
  const [variable,      setVariable]      = useState<Variable>("rain");
  const [date,          setDate]          = useState("2021-07-15");
  const [rainfallDelta, setRainfallDelta] = useState(0);
  const [tempDelta,     setTempDelta]     = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">

      <div className="flex-none">
        <DashboardTopbar date={date} />
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">

        <div className="flex-none h-full">
          <DashboardSidebar
            variable={variable}
            setVariable={setVariable}
            rainfallDelta={rainfallDelta}
            setRainfallDelta={setRainfallDelta}
            tempDelta={tempDelta}
            setTempDelta={setTempDelta}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 min-h-0">
            <ClimateMap
              variable={variable}
              date={date}
              onPointSelect={setSelectedPoint}
            />
          </div>
          <div className="flex-none">
            <DashboardTimebar date={date} setDate={setDate} />
          </div>
        </div>

        <div className="flex-none h-full hidden lg:block">
          <DashboardRightPanel
            selectedPoint={selectedPoint}
            variable={variable}
            date={date}
            rainfallDelta={rainfallDelta}
            tempDelta={tempDelta}
          />
        </div>

      </div>

      <div className="flex-none lg:hidden">
        <DashboardRightPanel
          selectedPoint={selectedPoint}
          variable={variable}
          date={date}
          rainfallDelta={rainfallDelta}
          tempDelta={tempDelta}
        />
      </div>

    </div>
  );
}
