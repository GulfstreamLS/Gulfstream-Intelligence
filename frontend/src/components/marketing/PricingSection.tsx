"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, User, Star, Users, Building2, ShieldCheck, Globe2, LockKeyhole, BadgeCheck, type LucideIcon } from "lucide-react";
import Cookies from "js-cookie";
import { cn } from "../../lib/utils";

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
    name: "Individual",
    description: "For independent regulatory professionals and consultants.",
    monthlyPrice: 59,
    annualPrice: 649,
    features: [
      "Regulatory Chat",
      "Document Intelligence",
      "10 document uploads / month",
      "Standard data coverage",
      "Unlimited chat sessions",
      "Global Gap Assessment",
      "Health Authority Simulation",
    ],
    cta: { label: "Start Individual Plan", href: "/register?plan=starter" },
    variant: "default",
  },
  {
    id: "business",
    name: "Business",
    badge: "Most Popular",
    description: "For biotech teams and collaborative regulatory organizations.",
    monthlyPrice: 275,
    annualPrice: 3000,
    features: [
      "Everything in Individual",
      "Team access (up to 5 users)",
      "Shared projects & folders",
      "Priority support",
      "Advanced analytics",
    ],
    cta: { label: "Start Business Plan", href: "/register?plan=business" },
    variant: "popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom infrastructure for global regulatory organizations.",
    monthlyPrice: null,
    annualPrice: null,
    features: [
      "Everything in Business",
      "Unlimited users",
      "Custom integrations",
      "Dedicated support",
      "SLA & compliance support",
    ],
    cta: { label: "Contact Sales", href: "#contact-us" },
    variant: "enterprise",
  },
];

const PLAN_ICONS: Record<string, LucideIcon> = {
  starter: User,
  business: Users,
  enterprise: Building2,
};

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: "Powered by OpenAI & Claude", body: "Access leading AI models for regulatory intelligence." },
  { icon: Globe2, title: "Global Regulatory Coverage", body: "Stay informed across major health authorities worldwide." },
  { icon: LockKeyhole, title: "Secure & Compliant", body: "Enterprise-grade security with privacy and data protection." },
  { icon: BadgeCheck, title: "Built for Life Sciences", body: "Purpose-built for regulatory professionals and teams." },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!Cookies.get("access_token"));
  }, []);

  return (
    <section className="py-7 lg:py-8 bg-[#F8FAFC] dark:bg-[#071B4D]" id="pricing">
      <div className="gs-container">

        {/* Header */}
        <div className="text-center mb-5 space-y-3">
          <p className="text-[clamp(1.25rem,2vw,1.8rem)] font-extrabold tracking-[0.16em] uppercase text-gs-navy dark:text-white">
            {SECTION_LABEL}
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-[#F1EEFF] px-7 py-2 text-[12px] font-bold uppercase tracking-[0.26em] text-[#4C1D95] shadow-sm dark:border-purple-400/30 dark:bg-purple-500/20 dark:text-purple-100">
            <Star className="h-3.5 w-3.5 fill-current" />
            Introductory pricing - for a limited time
          </div>

          {/* Toggle */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className={cn("text-sm font-semibold", !annual ? "text-gs-text dark:text-white" : "text-gs-muted")}>
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
            <span className={cn("text-sm font-semibold", annual ? "text-gs-text dark:text-white" : "text-gs-muted")}>
              Annual
            </span>
            <span className="text-[12px] font-bold bg-[#EAF7EF] text-[#15803D] px-5 py-1.5 rounded-full shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-400/20">
              Annual includes 1 month free
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 pt-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} isLoggedIn={isLoggedIn} />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-gs-border bg-white px-6 py-4 shadow-card dark:border-white/10 dark:bg-[#0F2241] sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-center gap-4">
              <Icon className="h-9 w-9 shrink-0 text-gs-blue dark:text-white" strokeWidth={2.1} />
              <div>
                <p className="text-[13px] font-bold text-gs-navy dark:text-white">{title}</p>
                <p className="text-[12px] leading-snug text-gs-muted dark:text-white/70">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[13px] text-gs-muted dark:text-white/70 mt-4">
          All plans include secure data handling, multi-model AI access, and global regulatory coverage.
        </p>
      </div>
    </section>
  );
}

function PlanCard({ plan, annual, isLoggedIn }: { plan: Plan; annual: boolean; isLoggedIn: boolean }) {
  const { id, name, badge, description, monthlyPrice, annualPrice, features, cta, variant } = plan;
  const price = monthlyPrice;
  const isEnterprise = variant === "enterprise";
  const isPopular = variant === "popular";
  const annualTotal = annual && annualPrice !== null ? annualPrice : null;

  const Icon = PLAN_ICONS[id] ?? User;

  // Surface an inherited "Everything in X" feature as the section heading.
  const firstFeature = features[0] ?? "";
  const hasInherited = firstFeature.toLowerCase().startsWith("everything in");
  const includesLabel = hasInherited
    ? `Includes ${firstFeature.charAt(0).toLowerCase()}${firstFeature.slice(1)}, plus:`
    : "Includes:";
  const listFeatures = hasInherited ? features.slice(1) : features;

  const ctaLabel = cta.label;
  const ctaHref  = isEnterprise ? cta.href  : isLoggedIn ? "/dashboard/subscription" : cta.href;

  return (
    <div
      className={cn(
        "rounded-2xl p-7 min-h-[565px] flex flex-col gap-5 border relative bg-white dark:bg-[#0F2241] transition-shadow",
        isPopular
          ? "border-gs-blue shadow-blue-glow lg:mt-2"
          : "border-gs-border dark:border-white/10 shadow-card lg:mt-0",
      )}
    >
      {/* Most Popular badge — centered on the top border */}
      {badge && (
        <span
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 text-[12px] font-bold uppercase tracking-[0.06em] text-white bg-gs-blue px-7 py-2 rounded-full whitespace-nowrap shadow-sm"
        >
          {badge}
        </span>
      )}

      {/* Icon + name */}
      <div className="pt-1">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-xl shrink-0",
              isEnterprise
                ? "bg-gs-purple/10 text-gs-purple dark:bg-gs-purple/20"
                : "bg-gs-blue/10 text-gs-blue dark:bg-gs-blue/20",
            )}
          >
            <Icon className="w-9 h-9" strokeWidth={2} />
          </span>
          <h3 className="font-bold text-2xl text-gs-navy dark:text-white leading-tight">
            {name}
          </h3>
        </div>
        <p className="text-[15px] mt-3 leading-relaxed text-gs-muted dark:text-white/70">
          {description}
        </p>
      </div>

      {/* Price */}
      <div className="border-t border-gs-border dark:border-white/10 pt-4">
        {price !== null ? (
          annual && annualTotal !== null ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <div className="flex items-end flex-wrap gap-1 leading-none whitespace-nowrap">
                  <span className="text-[clamp(2rem,3vw,2.65rem)] font-bold text-gs-blue dark:text-white">
                    ${price.toLocaleString("en-US")}
                  </span>
                  <span className="text-[12px] leading-none mb-2 text-gs-navy dark:text-white/70">
                    USD / month
                  </span>
                </div>
                <p className="text-[13px] mt-2 text-gs-blue font-semibold">
                  {id === "business" ? "Up to 5 users included" : "Billed monthly"}
                </p>
              </div>
              <div className="min-w-0 border-l border-gs-border dark:border-white/10 pl-3">
                <div className="flex items-end flex-wrap gap-1 leading-none whitespace-nowrap">
                  <span className="text-[clamp(2rem,3vw,2.65rem)] font-bold text-gs-blue dark:text-white">
                    ${annualTotal.toLocaleString("en-US")}
                  </span>
                  <span className="text-[12px] leading-none mb-2 text-gs-navy dark:text-white/70">
                    USD / year
                  </span>
                </div>
                <p className="text-[13px] mt-2 text-gs-green font-semibold">
                  Includes 1 month free
                </p>
                <p className="text-[13px] text-gs-muted dark:text-white/60">with annual billing</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-1.5 leading-none">
                <span className="text-[40px] font-bold text-gs-blue dark:text-white">
                  ${price.toLocaleString("en-US")}
                </span>
                <span className="text-sm mb-2 text-gs-navy dark:text-white/70">
                  USD / month
                </span>
              </div>
              <p className="text-[13px] mt-2 text-gs-blue font-semibold">
                {id === "business" ? "Up to 5 users included" : "Billed monthly"}
              </p>
            </>
          )
        ) : (
          <>
            <p className="text-[40px] font-bold text-[#3B087C] dark:text-white leading-none">
              Custom Pricing
            </p>
            <p className="text-[15px] text-gs-muted dark:text-white/60 mt-4">
              Tailored to your organization&apos;s needs.
            </p>
          </>
        )}
      </div>

      {/* Features */}
      <div className="flex-1">
        <p className="text-[15px] font-bold text-gs-navy dark:text-white mb-3">
          {includesLabel}
        </p>
        <ul className="space-y-2.5">
          {listFeatures.map((feat) => (
            <li key={feat} className="flex items-start gap-2">
              <Check
                className="w-4 h-4 shrink-0 mt-[1px] text-gs-green"
                strokeWidth={2.5}
              />
              <span className="text-[15px] text-gs-navy dark:text-white/80">
                {feat}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <Link
        href={ctaHref}
        className={cn(
          "w-full text-center text-base font-semibold py-3 rounded-[10px] transition-colors min-h-[48px] flex items-center justify-center mt-2",
          isEnterprise
            ? "bg-gs-navy text-white hover:bg-gs-deep-blue"
            : isPopular
            ? "bg-gs-blue text-white hover:bg-gs-deep-blue"
            : "border border-gs-blue text-gs-blue bg-white hover:bg-blue-50 dark:bg-transparent dark:text-white dark:border-white/30",
        )}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
