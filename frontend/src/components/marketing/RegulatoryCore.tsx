import Link from "next/link";
import { ArrowRight, Database, Network, Brain, History, ChartNoAxesColumnIncreasing } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface CoreFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const SECTION = {
  label: "YOUR REGULATORY CORE",
  heading: "One source of truth for your entire program.",
  description:
    "The Regulatory Core centralizes all intelligence across documents, strategy, risks, and decisions—so your team stays aligned and always ready.",
  cta: { label: "Learn more", href: "/register" },
};

const FEATURES: CoreFeature[] = [
  {
    icon: Database,
    title: "Centralized Intelligence",
    description:
      "All documents, strategies, gaps, risks, and decisions in one living knowledge base.",
  },
  {
    icon: Network,
    title: "Connected Across Modules",
    description:
      "Chat, gaps, simulations, and documents work together—always aligned.",
  },
  {
    icon: Brain,
    title: "Core Intelligence",
    description:
      "Continuously learns from new data, signals, and decisions to improve outcomes.",
  },
  {
    icon: History,
    title: "Persistent Memory",
    description:
      "Remembers your program context across sessions, so you never start over.",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Smarter Over Time",
    description:
      "Every insight improves your readiness score and strategic decisions.",
  },
];

export function RegulatoryCore() {
  return (
    <section className="py-4 lg:py-6 dark:bg-[#071B4D]">
      <div className="gs-container border rounded-[10px] border-[#D1DCF0] dark:border-white/10 bg-[#EFF6FF] dark:bg-[#0D1E3A] px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-6 lg:gap-10 items-center">

          {/* Left — copy */}
          <div className="space-y-5 flex flex-col justify-center">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-gs-blue">
              {SECTION.label}
            </p>

            <h2 className="text-2xl sm:text-3xl lg:text-[28px] font-medium text-[#300370] dark:text-white leading-tight">
              {SECTION.heading}
            </h2>

            <p className="text-[13px] text-[#300370] dark:text-white/70 leading-relaxed">
              {SECTION.description}
            </p>

            <Link
              href={SECTION.cta.href}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gs-blue hover:gap-3 transition-all w-fit"
            >
              {SECTION.cta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right — 5 features separated by vertical dividers */}
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 border-l pl-2 border-l-[#D1DCF0] sm:divide-x divide-[#D1DCF0] dark:divide-white/10">
            {FEATURES.map((feat) => (
              <CoreFeatureCard key={feat.title} feature={feat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CoreFeatureCard({ feature }: { feature: CoreFeature }) {
  const { icon: Icon, title, description } = feature;

  return (
    <div className="flex flex-col gap-3 px-6 py-4 sm:py-0 first:pl-0 last:pr-0">
      <Icon className="w-[100%] h-16 text-[#1D4ED8] dark:text-white/80 flex justify-center items-center" strokeWidth={0.8} />
      <div className="text-center">
        <h4 className="font-bold text-[15px] text-[#300370] dark:text-white leading-snug">
          {title}
        </h4>
        <p className="text-[13px] text-[#300370] dark:text-white/60 mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
