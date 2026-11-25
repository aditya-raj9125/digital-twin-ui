"use client";

const START = new Date("2012-01-01").getTime();
const END = new Date("2025-12-31").getTime();
const RANGE = END - START;

function dateToPercent(date: string) {
  const pct = ((new Date(date).getTime() - START) / RANGE) * 100;
  return Math.min(Math.max(pct, 0), 100);
}

function percentToDate(pct: number) {
  const ms = START + (pct / 100) * RANGE;
  return new Date(ms).toISOString().split("T")[0];
}

const EVENT_PRESETS = [
  { label: "2018 Floods", date: "2018-08-15" },
  { label: "2024 Monsoon", date: "2024-07-30" },
  { label: "2025 Val", date: "2025-06-15" },
];

interface Props {
  date: string;
  setDate: (d: string) => void;
  leadDay: number;
  setLeadDay: (d: number) => void;
}

export default function DashboardTimebar({ date, setDate, leadDay, setLeadDay }: Props) {
  const pct = dateToPercent(date);

  return (
    <div className="py-3 bg-[#0D1B2A] border-t border-primary-accent/15 flex flex-wrap items-center gap-4 px-5">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-primary-accent whitespace-nowrap">
          Timeline
        </span>
        <div className="hidden xl:flex items-center gap-1">
          {EVENT_PRESETS.map((p) => (
            <button
              key={p.date}
              onClick={() => setDate(p.date)}
              className={`font-mono text-[8px] px-1.5 py-0.5 rounded-sm border transition-colors cursor-pointer ${
                date === p.date
                  ? "bg-primary-accent/20 border-primary-accent/50 text-secondary-accent"
                  : "border-primary-accent/15 text-muted-text hover:text-white hover:border-primary-accent/35"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-[180px] flex flex-col gap-1">
        <div className="relative h-[3px] bg-[#1E3448] rounded-full group">
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-primary-accent to-secondary-accent"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            step={0.05}
            value={pct}
            onChange={(e) => setDate(percentToDate(Number(e.target.value)))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-secondary-accent border-2 border-[#0D1B2A] pointer-events-none"
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between font-mono text-[8px] text-muted-text tracking-wide">
          <span>Jan 2012</span>
          <span>Jul 2016</span>
          <span>Jan 2021</span>
          <span>Dec 2025</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[8px] uppercase tracking-wider text-muted-text mr-0.5">
          Horizon
        </span>
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <button
            key={d}
            onClick={() => setLeadDay(d)}
            className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm border transition-colors cursor-pointer ${
              leadDay === d
                ? "bg-secondary-accent text-[#0D1B2A] border-secondary-accent font-semibold"
                : "border-primary-accent/20 text-muted-text hover:text-white hover:border-primary-accent/40"
            }`}
          >
            D+{d + 1}
          </button>
        ))}
      </div>

      <span className="font-mono text-[10px] text-secondary-accent tracking-[0.1em] whitespace-nowrap">
        {date}
      </span>
    </div>
  );
}
