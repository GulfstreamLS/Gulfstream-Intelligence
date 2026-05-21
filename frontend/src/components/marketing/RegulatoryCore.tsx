"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Database, Network, Brain, History, ChartNoAxesColumnIncreasing, X } from "lucide-react";
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
  cta: { label: "Learn more" },
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

const MODAL = {
  label: "YOUR REGULATORY CORE",
  description:
    "The Regulatory Core centralizes your documents, decisions, risks, simulations, and strategic outputs into a continuously evolving intelligence system designed specifically for regulatory programs.",
  worksLabel: "HOW THE REGULATORY CORE WORKS",
  steps: [
    {
      title: "Your Content",
      description:
        "Upload or connect all your documents, plans, reports, and data across your program.",
    },
    {
      title: "AI Interaction",
      description:
        "Ask questions, run analyses, and explore regulatory strategies with AI.",
    },
    {
      title: "Insights & Outputs",
      description:
        "Generate assessments, simulations, gaps, and recommendations instantly.",
    },
    {
      title: "Core Intelligence",
      description: "Everything is connected and stored in your Regulatory Core.",
    },
    {
      title: "Persistent Memory",
      description:
        "Remembers your program context across sessions, so you never start over.",
    },
    {
      title: "Continuous Learning",
      description:
        "The Core learns from new data and decisions to improve future insights.",
    },
  ],
  footer: {
    title: "Secure. Private. Built for Life Sciences.",
    description:
      "Your program data is secure, encrypted, and never used to train public models.",
  },
};

export function RegulatoryCore() {
  const [modalOpen, setModalOpen] = useState(false);

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

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gs-blue hover:gap-3 transition-all w-fit"
            >
              {SECTION.cta.label}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right — 5 features separated by vertical dividers */}
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 border-l pl-2 border-l-[#D1DCF0] sm:divide-x divide-[#D1DCF0] dark:divide-white/10">
            {FEATURES.map((feat) => (
              <CoreFeatureCard key={feat.title} feature={feat} />
            ))}
          </div>
        </div>
      </div>

      {modalOpen && <RegulatoryCoreModal onClose={() => setModalOpen(false)} />}
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

function RegulatoryCoreModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="regulatory-core-modal-title"
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#0D1E3A] border border-[#D1DCF0] dark:border-white/10 shadow-2xl dark:shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-[#300370]/60 dark:text-white/60 hover:bg-[#EFF6FF] dark:hover:bg-white/10 hover:text-[#300370] dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8 lg:p-10">
          {/* Header */}
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-gs-blue">
            {MODAL.label}
          </p>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-10 items-start">
            <h2
              id="regulatory-core-modal-title"
              className="text-3xl sm:text-4xl font-bold text-[#300370] dark:text-white leading-tight pr-8"
            >
              The intelligence layer for{" "}
              <span className="text-gs-blue">your entire program.</span>
            </h2>
            <p className="text-[15px] text-[#300370] dark:text-white/70 leading-relaxed">
              {MODAL.description}
            </p>
          </div>

          {/* Steps */}
          <div className="mt-8 pt-8 border-t border-[#D1DCF0] dark:border-white/10">
            <p className="text-center text-[12px] font-bold tracking-[0.15em] uppercase text-gs-blue">
              {MODAL.worksLabel}
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-x-4 gap-y-7">
              {MODAL.steps.map((step, i) => (
                <div key={step.title}>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[14px] text-[#300370] dark:text-white leading-snug">
                      {i + 1}. {step.title}
                    </h4>
                    {i < MODAL.steps.length - 1 && (
                      <ArrowRight className="hidden lg:block w-4 h-4 shrink-0 text-gs-blue" />
                    )}
                  </div>
                  <p className="mt-2.5 text-[13px] text-[#300370] dark:text-white/60 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-8 border-t border-[#D1DCF0] dark:border-white/10">
            <div className="rounded-xl border border-[#D1DCF0] dark:border-white/10 bg-[#EFF6FF] dark:bg-white/5 px-5 py-4">
              <p className="text-[15px] font-bold text-gs-blue">
                {MODAL.footer.title}
              </p>
              <p className="mt-1 text-[13px] text-[#300370] dark:text-white/70 leading-relaxed">
                {MODAL.footer.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
