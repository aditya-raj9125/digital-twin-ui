import { SiNextdotjs, SiTypescript, SiTailwindcss, SiFastapi, SiPytorch, SiPython } from "react-icons/si";

type StackItem = {
  name: string;
  desc: string;
  icon?: React.ReactNode;
  abbr?: string;
};

const STACK = [
  {
    group: "Frontend",
    items: [
      { icon: <SiNextdotjs />, name: "Next.js", desc: "App framework" },
      { icon: <SiTailwindcss />, name: "Tailwind v4", desc: "Utility-first styling" },
      { icon: <SiTypescript />, name: "TypeScript", desc: "Development" },
    ],
  },
  {
    group: "Backend",
    items: [
      { icon: <SiPython />, name: "Python", desc: "Data & ML pipeline" },
      { icon: <SiFastapi />, name: "API Framework", desc: "TBD — FastAPI / Node.js" },
    ],
  },
  {
    group: "Data & ML",
    items: [
      { abbr: "xa", name: "xarray", desc: "Gridded dataset handling" },
      { abbr: "im", name: "imdlib", desc: "IMD data ingestion" },
      { icon: <SiPytorch />, name: "PyTorch", desc: "Model training" },
      { abbr: "CL", name: "ConvLSTM", desc: "Spatiotemporal forecasting" },
    ],
  },
  {
    group: "Data Sources",
    items: [
      { abbr: "IM", name: "IMD", desc: "Primary gridded climate data" },
      { abbr: "IN", name: "INSAT-3R", desc: "Satellite products · MOSDAC" },
    ],
  },
];

export default function TechStack() {
  return (
    <section className="rounded-b bg-primary-bg px-20 py-24 font-body text-primary-text max-sm:px-6 max-sm:py-16">

      <div className="mb-14">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary-accent mb-4">
        </p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-wide leading-tight">
          Tech <span className="text-secondary-accent">Stack</span>
        </h2>
      </div>

      <div className="flex flex-col gap-10">
        {STACK.map(({ group, items }) => (
          <div key={group}>
            <div className="flex items-center gap-3 mb-4">
              <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary-accent whitespace-nowrap">
                {group}
              </p>
              <div className="flex-1 h-px bg-primary-accent/15" />
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 max-sm:grid-cols-2">
              {items.map(({ icon, abbr, name }) => (
              <div
                key={name}
                className="bg-secondary-bg border border-primary-accent/10 rounded-sm p-4 flex flex-row gap-2 transition-colors duration-200 hover:border-primary-accent/40 hover:bg-[#1E3448]"
              >
                <span className="text-secondary-accent text-sm leading-none">
                  {icon ?? (
                    <span className="font-mono text-xs">{abbr}</span>
                   )}
                </span>
                <p className="text-sm font-medium text-secondary-text leading-none">{name}</p>
              </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
