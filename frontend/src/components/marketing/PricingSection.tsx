"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  features: string[];
  cta: { label: string; href: string };
  variant: "default" | "popular" | "enterprise";
}

const SECTION_LABEL = "FLEXIBLE PLANS. DESIGNED FOR REGULATORY TEAMS.";

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For individuals exploring regulatory intelligence.",
    monthlyPrice: 99,
    annualPrice: 79,
    features: [
      "Regulatory Chat",
      "Document Intelligence",
      "10 document uploads / month",
      "Standard data coverage",
    ],
    cta: { label: "Sign Up Now", href: "/register" },
    variant: "default",
  },
  {
    id: "professional",
    name: "Professional",
    badge: "Most Popular",
    description: "For professionals managing regulatory programs.",
    monthlyPrice: 299,
    annualPrice: 239,
    features: [
      "Everything in Starter",
      "Unlimited chat sessions",
      "Global Gap Assessment",
      "Health Authority Simulation",
    ],
    cta: { label: "Sign Up Now", href: "/register" },
    variant: "popular",
  },
  {
    id: "business",
    name: "Business",
    description: "For teams collaborating on multiple programs.",
    monthlyPrice: 699,
    annualPrice: 559,
    features: [
      "Everything in Professional",
      "Team access (up to 5 users)",
      "Shared projects & folders",
      "Priority support",
      "Advanced analytics",
    ],
    cta: { label: "Sign Up Now", href: "/register" },
    variant: "default",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For organizations with advanced needs.",
    monthlyPrice: null,
    annualPrice: null,
    features: [
      "Everything in Business",
      "Unlimited users",
      "Custom integrations",
      "Dedicated support",
      "SLA & compliance support",
    ],
    cta: { label: "Contact Sales", href: "#contact" },
    variant: "enterprise",
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="py-4 lg:py-6 bg-[#F8FAFC] dark:bg-[#071B4D]" id="pricing">
      <div className="gs-container">

        {/* Header */}
        <div className="text-center mb-4 space-y-4">
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-gs-blue">
            {SECTION_LABEL}
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3">
            <span className={cn("text-sm font-medium", !annual ? "text-gs-text dark:text-white" : "text-gs-muted")}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
                annual ? "bg-gs-blue" : "bg-gs-border",
              )}
              aria-label="Toggle billing period"
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                  annual ? "left-6" : "left-1",
                )}
              />
            </button>
            <span className={cn("text-sm font-medium", annual ? "text-gs-text dark:text-white" : "text-gs-muted")}>
              Annual
            </span>
            <span className="text-[11px] font-bold bg-[#F1F5F9] text-[#1D4ED8] px-2.5 py-1 rounded-full">
              Save 20%
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} />
          ))}
        </div>

        <p className="text-center text-[13px] text-[#300370] dark:text-white mt-4">
          All plans include secure data handling and global regulatory coverage.
        </p>
      </div>
    </section>
  );
}

function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const { name, badge, description, monthlyPrice, annualPrice, features, cta, variant } = plan;
  const price = annual ? annualPrice : monthlyPrice;
  const isEnterprise = variant === "enterprise";
  const isPopular = variant === "popular";

  return (
    <div
      className={cn(
        "rounded-2xl p-6 h-[420px] flex flex-col gap-4 border relative bg-white dark:bg-[#0F2241]",
        isPopular
          ? "border-gs-blue shadow-blue-glow"
          : "border-gs-border dark:border-white/10 shadow-card",
      )}
    >
      {/* Name + badge row */}
      <div className="pt-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg text-[#300370] dark:text-white leading-tight">
            {name}
          </h3>
          {badge && (
            <span className="text-[11px] font-bold text-white px-3 py-1 rounded-full whitespace-nowrap shrink-0"
            style={{ background: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%),#15803D ` }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-[13px] mt-1 leading-relaxed text-[#300370] dark:text-white/60">
          {description}
        </p>
      </div>

      {/* Price */}
      <div>
        {price !== null ? (
          <>
            <div className="flex items-end gap-1.5 leading-none">
              <span className="text-[34px] font-medium text-[#300370] dark:text-white">
                ${price}
              </span>
              <span className="text-sm mb-1.5 text-[#300370] dark:text-white/60">
                USD / month
              </span>
            </div>
            <p className="text-[12px] mt-1 text-gs-blue font-medium">
              Billed annually
            </p>
          </>
        ) : (
          <>
            <p className="text-[34px] font-medium text-[#300370] dark:text-white leading-none">
              Custom
            </p>
            <p className="text-[12px] text-[#300370]/60 dark:text-white/50 mt-1">
              Contact us for pricing
            </p>
          </>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2.5 flex-1">
        {features.map((feat) => (
          <li key={feat} className="flex items-start gap-2">
            <Check
              className="w-4 h-4 shrink-0 mt-[1px] text-gs-green"
              strokeWidth={2.5}
            />
            <span className="text-[13px] text-[#300370] dark:text-white/80">
              {feat}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={cta.href}
        className={cn(
          "w-full text-center text-sm font-semibold py-3 rounded-[10px] transition-colors min-h-[44px] flex items-center justify-center mt-2",
          isEnterprise
            ? "bg-gs-navy text-white hover:bg-gs-deep-blue"
            : isPopular
            ? "bg-gs-blue text-white hover:bg-gs-deep-blue"
            : "border border-gs-blue text-gs-blue bg-white hover:bg-blue-50 dark:bg-transparent dark:text-white dark:border-white/30",
        )}
      >
        {cta.label}
      </Link>
    </div>
  );
}
