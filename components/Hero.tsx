import Image from "next/image";
import globeImg from "@/public/assets/hero.svg"; 
import { ArrowRight, MoveRight, } from "lucide-react";
import HeroButtons from "@/components/HeroButtons";

export default function Hero() {
  return (
    <section>
    <div className="hidden md:flex bg-[url('@/public/assets/hero.svg')] bg-[length:auto_160%] bg-center bg-no-repeat h-screen flex-col overflow-hidden px-8 py-8">
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent z-0" />
      <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-transparent to-transparent z-0" />

      <div className="flex flex-row justify-between">
        <div className="mx-8 py-4  text-primary-text border-b-2 border-primary-accent animate-[fadeIn_1s_ease_both] max-sm:static max-sm:text-center">
  
          <p className="text-primary-text font-display text-3xl font-extrabold leading-snug tracking-wide">
            India&apos;s Digital <span className="text-secondary-text">Twin</span>
          </p>
          <p className="text-secondary-text font-medium font-mono text-sm tracking-[0.16em] uppercase text-primary-text mt-1">
            AI-Powered Climate Simulation
          </p>
        </div>

        <div className="font-bold font-mono text-right animate-[fadeIn_1s_ease_both] max-sm:static max-sm:text-center">
          <p className="text-sm tracking-[0.14em] uppercase">
            ISRO — BAH 2026
          </p>
          <p className="text-xs tracking-[0.12em] uppercase mt-1">
            Challenge 05
          </p>
        </div>
      </div>

      {/* Globe
      <div className="flex items-center justify-center my-4 animate-[float_7s_ease-in-out_infinite]">
        <Image
          src={globeImg}
          alt="Earth — India's Digital Twin"
          className="fdakw-[clamp(220px,38vw,460px)] drop-shadow-[0_30px_60px_rgba(86,124,141,0.12)] max-sm:w-[180px]"
          priority
        />
      </div>*/}

      <div className="px-8 h-full w-full flex flex-row justify-between">
      <div className="mt-12 text-primary-text h-full md:max-w-[25%] flex flex-col justify-start items-center text-left text-sm leading-relaxed text-secondary-text font-medium ">
        <p className="animate-[fadeIn_2.5s_ease_both] border-b border-secondary-bg mb-6 pb-6">
          Built on IMD gridded rainfall &amp; temperature records, INSAT-3R satellite
          products, and ConvLSTM deep learning — modelling and predicting India&apos;s
          atmospheric conditions at spatial resolution.
        </p>
        <p className="text-medium shadow-md animate-[fadeIn_2.5s_ease_both]">
          A what-if scenario engine lets you adjust temperature or rainfall inputs and
          observe the predicted regional climate response.
        </p>
      </div>
      <HeroButtons/>
           
      </div>

      <p className="absolute bottom-8 left-1/2 -translate-x-1/2 font-(family-name:--font-mono) text-[9px] tracking-[0.14em] uppercase text-[#B0BFCA] whitespace-nowrap animate-[fadeIn_2s_ease_both] max-sm:hidden">
        Pilot Region · Delhi NCR &nbsp;·&nbsp; IMD + INSAT-3R &nbsp;·&nbsp; ConvLSTM
      </p>

      </div>


      <div className="md:hidden relative flex flex-col justify-between items-center px-6 py-8 min-h-[90vh] text-center
  bg-[url('@/public/assets/hero-mobile.png')] bg-cover bg-center bg-no-repeat">
  
  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 z-0" />
  
  <div className="relative z-10 flex flex-col justify-between items-center min-h-screen py-12 gap-4">
    
    <div className="text-center">
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-secondary-accent mb-3">
        ISRO  BAH 2026  PS-5
      </p>
      <h1 className="font-display text-4xl font-bold tracking-wide leading-tight text-primary-text">
        India&apos;s Digital <span className="text-secondary-accent">Twin</span>
      </h1>
    </div>

    <div className="flex-1" />

    <div className="flex flex-col items-center gap-4">
      <p className="text-xs text-muted-text font-light leading-relaxed max-w-[280px]">
        AI-powered climate simulation built on IMD data, INSAT-3R satellite products, and ConvLSTM deep learning.
      </p>
      <HeroButtons />
      <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted-text/50">
        Pilot Region · Delhi NCR
      </p>
    </div>

  </div>
</div>
    </section>
  );
}
