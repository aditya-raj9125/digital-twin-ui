import { ChevronLeft, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Props {
  date: string;
  forecastDate?: string;
  split?: "train" | "validation";
  modelOnline: boolean;
  onOpenDiagnostics: () => void;
}

export default function DashboardTopbar({
  date,
  forecastDate,
  split,
  modelOnline,
  onOpenDiagnostics,
}: Props) {
  return (
    <div className="py-2 col-span-full bg-[#0D1B2A] border-b border-primary-accent/15 flex items-center justify-between px-5 z-10">
      <Link
        href="/"
        className="w-fit items-center text-sm text-white hover:text-secondary-text inline-flex gap-1 group"
      >
        <ChevronLeft className="opacity-0 group-hover:opacity-100 w-4 group-hover:-translate-x-1 transition-all duration-400" />
        <p className="group-hover:underline transition-all duration-300">Home</p>
      </Link>

      <div className="flex items-center gap-3">
        <span className="font-display text-sm font-semibold tracking-wide">
          India&apos;s <span className="text-secondary-accent">Digital Twin</span>
        </span>
        <div className="w-px h-4 bg-primary-accent/20 max-sm:hidden" />
        <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted-text max-sm:hidden">
          Pilot - Kerala (0.25° × 0.25°)
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDiagnostics}
          className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] uppercase px-2.5 py-1 rounded-sm border border-primary-accent/30 text-secondary-accent hover:bg-primary-accent/15 transition-colors cursor-pointer"
        >
          <BarChart3 className="w-3 h-3" />
          <span className="max-sm:hidden">Diagnostics</span>
        </button>

        {split && (
          <span
            className={`font-mono text-[9px] tracking-[0.08em] uppercase px-2 py-0.5 rounded-sm border max-md:hidden ${
              split === "validation"
                ? "border-amber-400/40 text-amber-300 bg-amber-400/10"
                : "border-primary-accent/25 text-muted-text"
            }`}
          >
            {split === "validation" ? "2025 Unseen Val" : "2012–24 Train"}
          </span>
        )}

        <span
          className={`flex items-center gap-1.5 font-mono text-[9px] tracking-[0.1em] uppercase ${
            modelOnline ? "text-green-400" : "text-amber-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              modelOnline ? "bg-green-400 animate-pulse" : "bg-amber-400"
            }`}
          />
          {modelOnline ? "ClimateDualNet Live" : "Connecting..."}
        </span>

        <div className="w-px h-4 bg-primary-accent/20 max-md:hidden" />
        <span className="font-mono text-[9px] text-muted-text tracking-[0.1em] max-md:hidden">
          {forecastDate || date}
        </span>
      </div>
    </div>
  );
}
