import Hero from "@/components/Hero";
import WhatWeBuilt from "@/components/WhatWeBuilt";
import Datasets from "@/components/Datasets";
import HowWeBuiltIt from "@/components/HowWeBuiltIt";
import TechStack from "@/components/TechStack";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="">
      <Hero />
      <WhatWeBuilt/> 
      <Datasets/>
      <HowWeBuiltIt/>
      <TechStack/>
      <Footer/>
    </main>
  );
}
