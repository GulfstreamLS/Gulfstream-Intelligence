"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap } from "lucide-react";
import { cn } from "../../lib/utils";
import { subscriptionApi } from "../../lib/api";
import { useChatStore } from "../../store/chatStore";
import type { Subscription } from "../../types";

const SOLO_PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "For individuals exploring regulatory intelligence.",
    monthly: 99,
    annual: 79,
    features: ["Regulatory Chat", "Document Intelligence", "10 document uploads / month", "Standard data coverage"],
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For professionals managing regulatory programs.",
    monthly: 299,
    annual: 239,
    features: ["Everything in Starter", "Unlimited chat sessions", "Global Gap Assessment", "Health Authority Simulation"],
    popular: true,
  },
];

const ORG_PLANS = [
  {
    id: "business",
    name: "Business",
    description: "For teams collaborating on multiple programs.",
    monthly: 699,
    annual: 559,
    features: ["Everything in Professional", "Team access (up to 5 users)", "Shared projects & folders", "Priority support", "Advanced analytics"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For organizations with advanced needs.",
    monthly: null,
    annual: null,
    features: ["Everything in Business", "Unlimited users", "Custom integrations", "Dedicated support", "SLA & compliance support"],
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const user = useChatStore((s) => s.user);
  const [annual, setAnnual] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stripeModal, setStripeModal] = useState(false);

  const isOrg = user?.account_type === "organization_member";
  const plans = isOrg ? ORG_PLANS : SOLO_PLANS;

  useEffect(() => {
    subscriptionApi.get().then(setSubscription).catch(() => null);
  }, []);

  const trialActive = subscription?.status === "trialing";
  const trialEnd = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  function handlePlanClick(planId: string) {
    if (planId === "enterprise") {
      router.push("/#contact-us");
      return;
    }
    setStripeModal(true);
  }

  return (
    <div className="min-h-screen bg-gs-bg">
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <p className="text-xs font-bold tracking-widest uppercase text-gs-blue">Plans &amp; Pricing</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gs-text">
            {isOrg ? "Choose a plan for your team" : "Choose your plan"}
          </h1>
          {trialActive && trialEnd && (
            <div className="inline-flex items-center gap-2 bg-gs-blue/10 border border-gs-blue/20 text-gs-blue text-sm font-medium px-4 py-2 rounded-full">
              <Zap className="w-3.5 h-3.5" />
              Free trial active · expires {trialEnd}
            </div>
          )}
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={cn("text-sm font-medium", !annual ? "text-gs-text" : "text-gs-muted")}>Monthly</span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className={cn("relative w-11 h-6 rounded-full transition-colors", annual ? "bg-gs-blue" : "bg-gs-border")}
          >
            <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", annual ? "left-6" : "left-1")} />
          </button>
          <span className={cn("text-sm font-medium", annual ? "text-gs-text" : "text-gs-muted")}>Annual</span>
          <span className="text-xs font-bold bg-gs-blue/10 text-gs-blue px-2.5 py-1 rounded-full">Save 20%</span>
        </div>

        {/* Plan cards */}
        <div className={cn("grid gap-6", plans.length === 2 ? "max-w-2xl mx-auto grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
          {plans.map((plan) => {
            const isEnterprise = plan.id === "enterprise";
            const isCurrent = subscription?.plan === plan.id && subscription?.status === "active";
            const price = annual ? plan.annual : plan.monthly;

            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-2xl p-6 flex flex-col gap-4 border bg-gs-card relative",
                  plan.popular ? "border-gs-blue shadow-lg" : "border-gs-border shadow-card",
                  isCurrent && "ring-2 ring-gs-green"
                )}
              >
                {plan.popular && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-gs-blue px-3 py-1 rounded-full whitespace-nowrap">
                    Recommended
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-gs-green px-3 py-1 rounded-full whitespace-nowrap">
                    Current Plan
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-gs-text">{plan.name}</h3>
                  <p className="text-sm text-gs-muted mt-0.5">{plan.description}</p>
                </div>

                <div>
                  {price !== null ? (
                    <>
                      <div className="flex items-end gap-1 leading-none">
                        <span className="text-4xl font-bold text-gs-text">${price}</span>
                        <span className="text-sm text-gs-muted mb-1">USD / month</span>
                      </div>
                      <p className="text-xs text-gs-blue font-medium mt-1">
                        {annual ? "Billed annually" : "Billed monthly"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-4xl font-bold text-gs-text">Custom</p>
                      <p className="text-xs text-gs-muted mt-1">Contact us for pricing</p>
                    </>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 shrink-0 mt-[2px] text-gs-green" strokeWidth={2.5} />
                      <span className="text-sm text-gs-text">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanClick(plan.id)}
                  className={cn(
                    "w-full py-3 rounded-xl text-sm font-semibold transition-colors min-h-[44px]",
                    isCurrent
                      ? "bg-gs-green/10 text-gs-green border border-gs-green cursor-default"
                      : isEnterprise
                      ? "bg-gs-navy text-white hover:bg-opacity-90"
                      : plan.popular
                      ? "bg-gs-blue text-white hover:bg-gs-deep-blue"
                      : "border border-gs-blue text-gs-blue hover:bg-gs-blue/5"
                  )}
                  disabled={isCurrent}
                >
                  {isCurrent ? "Current Plan" : isEnterprise ? "Contact Sales" : trialActive ? "Subscribe" : "Start Free Trial"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gs-muted mt-8">
          All plans include a 7-day free trial. No credit card required.
        </p>

        {user && (
          <div className="text-center mt-4">
            <button onClick={() => router.push("/dashboard")} className="text-sm text-gs-sky hover:text-gs-blue underline">
              Back to dashboard
            </button>
          </div>
        )}
      </div>

      {/* Stripe coming soon modal */}
      {stripeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setStripeModal(false)}>
          <div className="bg-gs-card border border-gs-border rounded-2xl p-8 max-w-sm w-full shadow-card-hover text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-gs-blue/10 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-gs-blue" />
            </div>
            <h2 className="text-xl font-bold text-gs-text">Payment coming soon</h2>
            <p className="text-sm text-gs-muted">
              We&apos;re setting up our payment system. You&apos;ll be notified by email as soon as billing is live.
              Your free trial remains active in the meantime.
            </p>
            <button onClick={() => setStripeModal(false)} className="btn-primary w-full min-h-[44px]">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
