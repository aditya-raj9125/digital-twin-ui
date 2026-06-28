import { LayoutDashboard, Waypoints, Presentation } from "lucide-react";
import Link from "next/link";

export default function HeroButtons() {
  return (
    <div className="w-full md:w-fit mb-8 font-body self-end flex flex-col gap-1 animate-[fadeIn_2.5s_ease_both] pl-4">

      <Link href="/dashboard" className="w-full px-5 py-2.5 bg-secondary-accent text-primary-bg rounded-sm inline-flex items-center gap-3 cursor-pointer group transition-all duration-300 hover:bg-secondary-bg hover:text-primary-text ">
        <LayoutDashboard className="w-4 shrink-0 group-hover:rotate-90 transition-all duration-400" />
        <p className="text-sm font-medium tracking-wide">Go To Dashboard</p>
      </Link>

      <button className="w-full px-5 py-2.5 border border-muted-text text-secondary-text hover:text-secondary-bg rounded-md inline-flex items-center gap-3 cursor-pointer group transition-all duration-300 hover:bg-secondary-text">
        <Waypoints className="w-4 shrink-0 group-hover:rotate-90 transition-all duration-400" />
        <p className="text-sm font-normal tracking-wide">See Presentation</p>
      </button>

      <button className="w-full px-5 py-2.5 text-muted-text rounded-full inline-flex items-center gap-3 cursor-pointer group transition-all duration-300 hover:text-secondary-accent">
        <Presentation className="w-4 shrink-0 transition-transform duration-300 group-hover:rotate-12" />
        <p className="text-sm font-normal tracking-wide">Our Approach</p>
      </button>

    </div> 
  );
}
