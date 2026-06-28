import { ChevronLeft, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DashboardTopbar({ date }: { date: string }) {
  return (
    <div className="col-span-full bg-[#0D1B2A] border-b border-primary-accent/15 flex items-center justify-between px-5 z-10">
      <Link href="/" className="w-6 text-white hover:text-primary-accent inline-flex gap-1 group">
        <ChevronLeft className="group-hover:-translate-x-1"/>
      </Link>
      <div className="flex items-center gap-3">
        <span className="font-display text-sm font-semibold tracking-wide">
          India&apos;s <span className="text-secondary-accent">Digital Twin</span>
        </span>
        <div className="w-px h-4 bg-primary-accent/20" />
        <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted-text">
          Pilot - Delhi NCR
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.1em] uppercase text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          IMD Live
        </span>
        <div className="w-px h-4 bg-primary-accent/20" />
        <span className="font-mono text-[9px] text-muted-text tracking-[0.1em]">
          {date}
        </span>
      </div>

    </div>
  );
}
