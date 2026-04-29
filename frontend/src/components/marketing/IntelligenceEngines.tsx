import Link from "next/link";
import { ArrowRight, ClipboardCheck, Users, CheckCircle2, MessageSquareMore, FileText } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface Engine {
  id: string;
  badge?: string;
  icon: LucideIcon;
  iconBg: string;
  title: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string };
  checkColor: string;
  ctaColor: string;
}

const SECTION_LABEL = "FOUR INTELLIGENCE ENGINES. ONE REGULATORY ADVANTAGE.";

const ENGINES: Engine[] = [
  {
    id: "regulatory-chat",
    badge: "NEW",
    icon: MessageSquareMore,
    iconBg: "#1D4ED8",
    title: "Regulatory Chat",
    tagline: "Get defensible regulatory answers in seconds.",
    features: [
      "Program-specific intelligence",
      "Global authority perspectives",
      "Citations from guidance & precedent",
      "Persistent memory across chats",
    ],
    cta: { label: "Start Chat", href: "/chat" },
    checkColor: "text-gs-blue",
    ctaColor: "text-[#1D4ED8] hover:text-gs-deep-blue",
  },
  {
    id: "gap-assessment",
    icon: ClipboardCheck,
    iconBg: "#15803D",
    title: "Global Gap Assessment",
    tagline: "Know exactly what will get flagged before submission.",
    features: [
      "FDA, EMA, PMDA & more",
      "Domain-based scoring engine",
      "Severity, impact & sequencing",
      "Actionable recommendations",
    ],
    cta: { label: "Run Assessment", href: "/register" },
    checkColor: "text-gs-green",
    ctaColor: "text-[#15803D] hover:text-green-700",
  },
  {
    id: "ha-simulation",
    icon: Users,
    iconBg: "#6D28D9",
    title: "Health Authority Simulation",
    tagline: "Anticipate FDA / EMA objections before they happen.",
    features: [
      "AI models of reviewer behavior",
      "Likely questions & objections",
      "Authority-specific feedback",
      "Strengthen your response strategy",
    ],
    cta: { label: "Run Simulation", href: "/register" },
    checkColor: "text-gs-purple",
    ctaColor: "text-[#6D28D9] hover:text-purple-800",
  },
  {
    id: "doc-intelligence",
    icon: FileText,
    iconBg: "#0E7490",
    title: "Document Intelligence",
    tagline: "Turn thousands of pages into clear regulatory strategy.",
    features: [
      "Extract key insights in seconds",
      "Gap & risk identification",
      "Inconsistency detection",
      "Regulatory implications mapped",
    ],
    cta: { label: "Upload & Analyze", href: "/register" },
    checkColor: "text-[#0891B2]",
    ctaColor: "text-[#0E7490] hover:text-[#0369a1]",
  },
];

export function IntelligenceEngines() {
  return (
    <section className="py-4 lg:py-6 dark:bg-[#0D1E3A]" id="platform">
      <div className="gs-container">
        <p className="text-center text-[16px] font-bold tracking-[0.15em] uppercase text-gs-blue mb-4">
          {SECTION_LABEL}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
          {ENGINES.map((engine) => (
            <EngineCard key={engine.id} engine={engine} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EngineCard({ engine }: { engine: Engine }) {
  const { icon: Icon, badge, iconBg, title, tagline, features, cta, checkColor, ctaColor } = engine;

  return (
    <div className="bg-white dark:bg-[#0F2241] border border-gs-border dark:border-white/10 rounded-2xl p-6 flex flex-col gap-5 hover:shadow-card-hover transition-shadow">
      {/* Icon row */}
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm" style={{ background: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%), ${iconBg}` }}>
          <Icon className="w-8 h-8 text-white" strokeWidth={1.8} />
        </div>
        {badge && (
          <span className={`text-[10px] font-bold uppercase tracking-wide bg-[#F1F5F9] text-${iconBg} px-2.5 py-1 rounded-full`}>
            {badge}
          </span>
        )}
      </div>

      {/* Title + tagline */}
      <div>
        <h3 className="font-bold text-[15px] text-[#300370] dark:text-white leading-snug">{title}</h3>
        <p className="text-[13px] text-[#300370] dark:text-white/70 mt-1.5 leading-relaxed">{tagline}</p>
      </div>

      {/* Feature list */}
      <ul className="space-y-2.5 flex-1">
        {features.map((feat) => (
          <li key={feat} className="flex items-start gap-2">
            <CheckCircle2 className={`w-[15px] h-[15px] shrink-0 mt-[1px] ${checkColor}`} strokeWidth={2} />
            <span className="text-[13px] text-[#300370] dark:text-white/70 leading-snug">{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={cta.href}
        className={`inline-flex items-center gap-1 text-[13px] font-semibold transition-all hover:gap-2 ${ctaColor}`}
      >
        {cta.label} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
