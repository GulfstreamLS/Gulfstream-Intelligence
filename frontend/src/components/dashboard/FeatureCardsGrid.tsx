import { MessageSquare, ClipboardList, Users, FileSearch } from "lucide-react";
import { FeatureCard, FeatureCardData } from "./FeatureCard";

const FEATURE_CARDS: FeatureCardData[] = [
  {
    icon: MessageSquare,
    iconBg: "bg-gs-blue",
    title: "Regulatory Chat",
    description: "Ask any question. Get clear answers on any topic.",
    features: [
      "General knowledge",
      "Research & explanations",
      "Planning & problem solving",
      "Data analysis & summaries",
    ],
    ctaLabel: "Start Chat",
    ctaHref: "/dashboard/chat",
  },
  {
    icon: ClipboardList,
    iconBg: "bg-gs-green",
    title: "Global Gap Assessment",
    description:
      "Identify gaps, risks, and readiness across regions and submission stages.",
    features: [
      "IND, NDA, BLA, MAA & more",
      "Global & region-specific gaps",
      "Risk scoring & prioritization",
      "Actionable recommendations",
    ],
    ctaLabel: "Run Assessment",
    ctaHref: "/dashboard/gap-assessment",
  },
  {
    icon: Users,
    iconBg: "bg-gs-purple",
    title: "Health Authority Simulation",
    description:
      "Anticipate health authority questions and pressure-test your strategy.",
    features: [
      "FDA, EMA, MHRA, PMDA & more",
      "Realistic authority perspectives",
      "Response strategies",
      "Strengthen your position",
    ],
    ctaLabel: "Simulate HA Review",
    ctaHref: "/dashboard/ha-simulation",
  },
  {
    icon: FileSearch,
    iconBg: "bg-gs-sky",
    title: "Document Intelligence",
    description:
      "Extract regulatory insights, gaps, and risks from source documents.",
    features: [
      "Key insight extraction",
      "Gap & risk identification",
      "Inconsistency detection",
      "Regulatory implications",
    ],
    ctaLabel: "Upload & Analyze",
    ctaHref: "/dashboard/documents",
  },
];

export function FeatureCardsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {FEATURE_CARDS.map((card) => (
        <FeatureCard key={card.title} data={card} />
      ))}
    </div>
  );
}
