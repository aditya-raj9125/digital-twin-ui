export default function Datasets() {
  return (
    <section className="bg-secondary-bg px-20 py-24 font-body text-primary-text max-sm:px-6 max-sm:py-16">

      <div className="max-w-[600px] mb-16">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary-accent mb-4">
          Data Infrastructure
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-wide leading-tight mb-3">
          Datasets &amp; <span className="text-secondary-accent">Sources</span>
        </h2>
        <p className="text-sm leading-relaxed text-muted-text font-light">
          All climate variables are sourced from authoritative Indian government repositories.
          IMD gridded data forms the primary training corpus; INSAT-3R satellite products
          serve as secondary spatial validation inputs.
        </p>
      </div>

      <div className="flex flex-col gap-12">

        <div className="border border-primary-accent/15 rounded-md overflow-hidden">

          <div className="flex items-center justify-between px-6 py-4 bg-primary-bg border-b border-primary-accent/15 max-sm:flex-col max-sm:gap-2 max-sm:items-start">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-secondary-accent border border-secondary-accent/40 bg-secondary-accent/10 px-2 py-0.5 rounded-sm">
                Primary
              </span>
              <span className="font-display text-lg md:text-xl font-bold tracking-wide">IMD Gridded Data</span>
            </div>
            <div className="font-mono text-[9px] tracking-[0.1em] text-muted-text text-right leading-loose max-sm:text-left">
              imdpune.gov.in  via imdlib<br />
              Format: .GRD
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary-bg/50">
                  {["Variable", "Resolution", "Grid Shape (1 Year)", "Unit", "Coverage",].map((h) => (
                    <th key={h} className="font-mono text-[9px] tracking-[0.15em] uppercase text-primary-accent font-normal text-left px-6 py-2.5 border-b border-primary-accent/15">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { var: "rain", res: "0.25° × 0.25° (~25km)", shape: "(365, 129, 135)", unit: "mm/day", cov: "2021–2022" },
                  { var: "tmax", res: "1° × 1° (~100km)", shape: "(365, 31, 31)", unit: "°C", cov: "2021–2022" },
                  { var: "tmin", res: "1° × 1° (~100km)", shape: "(365, 31, 31)", unit: "°C", cov: "2021–2022" },
                ].map((row) => (
                  <tr key={row.var} className="border-b border-secondary-bg/60 hover:bg-primary-accent/5 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-secondary-accent">{row.var}</td>
                    <td className="px-6 py-3 text-secondary-text text-xs">{row.res}</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-text">{row.shape}</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-text">{row.unit}</td>
                    <td className="px-6 py-3 text-secondary-text text-xs">{row.cov}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-8 flex-wrap px-6 py-3 bg-primary-bg/30 border-t border-primary-accent/10">
            {[
              ["Lat Range", "6.5°N – 38.5°N"],
              ["Lon Range", "66.5°E – 100°E"],
              ["Temporal Res", "Daily"],
              ["Missing Value", "999"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="font-mono text-xs tracking-[0.15em] uppercase text-primary-accent">{label}</span>
                <span className="font-mono text-xs text-secondary-text">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-primary-accent/15 rounded-md overflow-hidden">

          <div className="flex items-center justify-between px-6 py-4 bg-primary-bg border-b border-primary-accent/15 max-sm:flex-col max-sm:gap-2 max-sm:items-start">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-muted-text border border-muted-text/40 bg-muted-text/10 px-2 py-0.5 rounded-sm">
                Secondary
              </span>
              <span className="font-display text-lg md:text-xl font-bold tracking-wide">INSAT-3R / MOSDAC</span>
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-amber-400 border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 rounded-sm">
                Pending
              </span>
            </div>
            <div className="font-mono text-[9px] tracking-[0.1em] text-muted-text text-right leading-loose max-sm:text-left">
              mosdac.gov.in<br />
              Format - NetCDF
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary-bg/50">
                  {["Product", "Variable", "Data Shape", "Unit", "Coverage"].map((h) => (
                    <th key={h} className="font-mono text-[9px] tracking-[0.15em] uppercase text-primary-accent font-normal text-left px-6 py-2.5 border-b border-primary-accent/15">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { product: "LST", var: "Land Surface Temp", shape: "", unit: "°C", cov: "India" },
                  { product: "SST", var: "Sea Surface Temp", shape: "", unit: "°C", cov: "India" },
                  { product: "IMC", var: "Rainfall", shape: "", unit: "°C", cov: "India" },
                ].map((row) => (
                  <tr key={row.product} className="border-b border-secondary-bg/60 last:border-0 hover:bg-primary-accent/5 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-secondary-accent">{row.product}</td>
                    <td className="px-6 py-3 text-secondary-text text-xs">{row.var}</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-text">{row.shape}</td>
                    <td className="px-6 py-3 text-secondary-text text-xs">{row.unit}</td>
                    <td className="px-6 py-3 text-secondary-text text-xs">{row.cov}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
