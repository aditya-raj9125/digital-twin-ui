import Image from "next/image";

export default function WhatWeBuilt() {
  return (
    <section className="bg-primary-bg px-20 py-28 font-body text-primary-text max-sm:px-6 max-sm:py-16">

      <div className="mx-auto text-center mb-24">
    
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-wide leading-tight mb-5">
          What We <span className="text-secondary-accent">Built</span>
        </h2>
        <p className="text-sm leading-relaxed text-muted-text font-light mx-auto">
          India&apos;s climate systems are complex, interdependent, and historically difficult to model
          at fine spatial resolution. PS-5 challenged teams to build an AI-powered digital twin —
          a living simulation that mirrors real atmospheric conditions and enables scenario-based
          exploration of climate futures.
        </p>
        <div className="w-10 h-0.5 bg-primary-accent rounded-full mx-auto mt-6" />
      </div>

      <div className="grid grid-cols-2 gap-12 items-center mb-20 max-sm:grid-cols-1">
        <div className="flex flex-col gap-4">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-primary-accent inline-flex items-center gap-2 before:content-[''] before:w-4 before:h-px before:bg-primary-accent">
            Interactive Dashboard
          </span>
          <h3 className="font-display text-xl md:text-3xl font-bold tracking-wide leading-snug">
            Explore Climate at Every Grid Point
          </h3>
          <p className="text-sm leading-loose text-muted-text font-light">
            The dashboard renders <strong className="text-secondary-text font-normal">IMD gridded data</strong> directly
            onto an interactive map of India — zoom into any region, scrub through time, and observe how rainfall
            and temperature fields evolve day by day. Sliders let you adjust input parameters and instantly see
            the model&apos;s predicted climate response across the pilot region.
          </p>
          <div className="md:hidden relative rounded-md overflow-hidden border border-secondary-bg aspect-video bg-secondary-bg flex items-center justify-center shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(42,127,175,0.1)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-accent/5 before:to-transparent after:absolute after:top-0 after:left-0 after:w-8 after:h-8 after:border-t-2 after:border-l-2 after:border-primary-accent after:rounded-tl-md">
            <Image 
		          src="/assets/dashboard_ss.jpg" 
		          fill
		          alt="dashboard image"
		        />
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {["Kerala Pilot", "0.25° Resolution", "What-If Scenarios", "Time Scrubber"].map((tag) => (
              <span key={tag} className="font-mono text-[9px] tracking-[0.1em] uppercase text-secondary-accent border border-primary-accent/25 rounded-sm px-2 py-0.5 bg-primary-accent/5">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden relative rounded-md overflow-hidden border border-secondary-bg aspect-video bg-secondary-bg md:flex items-center justify-center shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(42,127,175,0.1)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-accent/5 before:to-transparent after:absolute after:top-0 after:left-0 after:w-8 after:h-8 after:border-t-2 after:border-l-2 after:border-primary-accent after:rounded-tl-md">
          <Image 
            src="/assets/dashboard_ss.jpg" 
            fill
            alt="dashboard image"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 items-center max-sm:grid-cols-1">
        <div className="hidden relative rounded-md overflow-hidden border border-secondary-bg aspect-video bg-secondary-bg md:flex items-center justify-center shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(42,127,175,0.1)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-accent/5 before:to-transparent after:absolute after:top-0 after:left-0 after:w-8 after:h-8 after:border-t-2 after:border-l-2 after:border-primary-accent after:rounded-tl-md">
          <Image 
            src="/assets/sample_rain.jpg" 
            fill
            alt="dashboard image"
          />
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-primary-accent inline-flex items-center gap-2 before:content-[''] before:w-4 before:h-px before:bg-primary-accent">
            ML Pipeline
          </span>
          <h3 className="font-display text-xl md:text-3xl font-bold tracking-wide leading-snug">
            ConvLSTM — Seeing the Atmosphere in Space and Time
          </h3>
          <p className="text-sm leading-loose text-muted-text font-light">
            Beneath the interface sits a <strong className="text-secondary-text font-normal">ConvLSTM deep learning model</strong> trained
            on multi-year IMD records and INSAT-3R satellite products. It ingests 7-day sequences of spatial climate
            fields and predicts next-day rainfall and temperature — preserving both the temporal patterns of weather
            systems and the spatial structure of the Indian subcontinent.
          </p>
          <div className="flex md:hidden relative rounded-md overflow-hidden border border-secondary-bg aspect-video bg-secondary-bg items-center justify-center shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(42,127,175,0.1)] before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary-accent/5 before:to-transparent after:absolute after:top-0 after:left-0 after:w-8 after:h-8 after:border-t-2 after:border-l-2 after:border-primary-accent after:rounded-tl-md">
            <Image 
				      src="/assets/sample_rain.jpg" 
				      fill
				      alt="data image"
				   />
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {["ConvLSTM", "IMD + INSAT-3R", "7-Day Input Window", "Next-Day Forecast"].map((tag) => (
              <span key={tag} className="font-mono text-[9px] tracking-[0.1em] uppercase text-secondary-accent border border-primary-accent/25 rounded-sm px-2 py-0.5 bg-primary-accent/5">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
