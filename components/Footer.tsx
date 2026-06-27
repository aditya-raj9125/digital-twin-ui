import { ArrowRight, LayoutDashboard, Presentation } from "lucide-react";
import { FaGithub } from "react-icons/fa";

const MEMBERS = ["Aditya", "Kavya", "Anas"];

const LINKS = [
  { icon: <LayoutDashboard className="w-3.5 h-3.5" />, label: "Dashboard", href: "#" },
  { icon: <Presentation className="w-3.5 h-3.5" />, label: "Presentation", href: "#" },
  { icon: <FaGithub className="w-3.5 h-3.5" />, label: "GitHub Repository", href: "#" },
];

const BUILT_WITH = ["Next.js", "PyTorch", "ConvLSTM"];

export default function Footer() {
  return (
    <footer className="border-t-2 border-primary-accent bg-[#0A1520] border-t border-primary-accent/15 font-body text-primary-text">

      <div className="px-20 py-16 grid grid-cols-3 gap-4 md:gap-12 items-start max-sm:grid-cols-2 md:divide-x md:divide-x-2 divide-primary-accent/30 max-sm:px-6 max-sm:py-10 max-sm:gap-8">

        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-xl md:text-2xl font-bold tracking-wide leading-tight mb-2">
            India&apos;s <span className="text-secondary-accent">Digital Twin</span>
          </p>
          <p className="text-xs text-muted-text font-light leading-relaxed max-w-[260px] mb-5">
            AI-Powered Digital Twin of India&apos;s Climate using India&apos;s National Data
          </p>
          <span className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.15em] uppercase text-primary-accent border border-primary-accent/30 rounded-sm px-2.5 py-1 bg-primary-accent/5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-accent" />
              Pull_Request Pending
          </span>
        </div>

        <div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary-accent mb-4">
            Team
          </p>
          <p className="font-mono text-sm md:text-md md:text-lg font-bold tracking-widest text-secondary-accent mb-3">
            Pull_Request Pending
          </p>
          <div className="flex flex-col gap-2">
            {MEMBERS.map((name) => (
              <span key={name} className="flex items-center gap-2 text-sm text-secondary-text font-light">
                <span className="w-1 h-1 rounded-full bg-primary-accent flex-shrink-0" />
                {name}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-primary-accent mb-4">
            Links
          </p>
          <div className="flex flex-col gap-2.5">
            {LINKS.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                className="inline-flex items-center gap-2 text-xs md:text-sm text-muted-text hover:text-secondary-accent transition-colors duration-200 w-fit group"
              >
                <span className="w-7 h-7 border border-primary-accent/25 rounded-full bg-primary-accent/5 flex items-center justify-center text-secondary-accent flex-shrink-0">
                  {icon}
                </span>
                {label}
                <ArrowRight className="opacity-0 group-hover:opacity-100 w-4 group-hover:translate-x-1 transition-all duration 400"/>
              </a>
            ))}
          </div>
        </div>

      </div>

      <div className="border-t border-primary-accent/10 px-20 py-4 flex items-center justify-between flex-wrap gap-3 max-sm:px-6">
        <p className="hidden md:block font-mono text-[9px] tracking-[0.12em] uppercase text-primary-accent/50">
          Built with{" "}
          {BUILT_WITH.map((tech, i) => (
            <span key={tech}>
              <span className="text-primary-accent">{tech}</span>
              {i < BUILT_WITH.length - 1 && <span className="text-primary-accent/30"> · </span>}
            </span>
          ))}
        </p>
        <p className="font-mono text-[9px] tracking-[0.12em] uppercase text-primary-accent/50">
          Bharatiya Antariksh Hackathon 2026
        </p>
      </div>

    </footer>
  );
}
