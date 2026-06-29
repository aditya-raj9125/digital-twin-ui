"use client";

const START = new Date("2021-01-01").getTime();
const END   = new Date("2022-12-31").getTime();
const RANGE = END - START;

function dateToPercent(date: string) {
  return ((new Date(date).getTime() - START) / RANGE) * 100;
}

function percentToDate(pct: number) {
  const ms = START + (pct / 100) * RANGE;
  return new Date(ms).toISOString().split("T")[0];
}

interface Props {
  date: string;
  setDate: (d: string) => void;
}

export default function DashboardTimebar({ date, setDate }: Props) {
  const pct = dateToPercent(date);

  return (
    <div className="py-4 col-start-2 bg-[#0D1B2A] border-t border-primary-accent/15 flex items-center gap-4 px-6
      max-lg:col-span-full max-lg:row-start-4">

      <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-primary-accent whitespace-nowrap">
        Timeline
      </span>

      <div className="flex-1 flex flex-col gap-1">
        <div className="relative h-[3px] bg-[#1E3448] rounded-full group">
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-primary-accent to-secondary-accent"
            style={{ width: `${pct}%` }}
          />
          <div
            className="group-hover:scale-175 absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-secondary-accent border border-[#0D1B2A] pointer-events-none transition-transform duration-150"
            style={{ left: `${pct}%` }}
          />
          <input
            type="range"
            min={0} max={100} step={0.1}
            value={pct}
            onChange={(e) => setDate(percentToDate(Number(e.target.value)))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            onMouseEnter={(e) => e.currentTarget.classList.add("thumb-hover")}
            onMouseLeave={(e) => e.currentTarget.classList.remove("thumb-hover")}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-secondary-accent border-2 border-[#0D1B2A] pointer-events-none"
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between font-mono text-[8px] text-muted-text tracking-wide">
          <span>Jan 2021</span>
          <span>Jul 2021</span>
          <span>Jan 2022</span>
          <span>Dec 2022</span>
        </div>
      </div>

      <span className="font-mono text-[10px] text-secondary-accent tracking-[0.1em] whitespace-nowrap">
        {date}
      </span>

    </div>
  );
}
