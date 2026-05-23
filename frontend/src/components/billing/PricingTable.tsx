"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, AlertCircle, X, User, Users, Building2, Star, ShieldCheck, Globe2, LockKeyhole, BadgeCheck, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { subscriptionApi, billingApi } from "../../lib/api";
import { useChatStore } from "../../store/chatStore";
import { ConfirmModal } from "../ui/ConfirmModal";
import type { Subscription } from "../../types";

interface Toast { type: "success" | "error"; message: string; }

interface Plan {
  id: string;
  name: string;
  description: string;
  monthly_price: number | null;
  annual_price: number | null;
  features: string[];
  popular?: boolean;
}

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

const DEFAULT_PLAN_GROUPS: { solo: Plan[]; organization: Plan[] } = {
  solo: [
    {
      id: "starter",
      name: "Individual",
      description: "For independent regulatory professionals and consultants.",
      monthly_price: 59,
      annual_price: 649,
      features: [
        "Regulatory Chat",
        "Document Intelligence",
        "10 document uploads / month",
        "Standard data coverage",
        "Unlimited chat sessions",
        "Global Gap Assessment",
        "Health Authority Simulation",
      ],
      popular: false,
    },
  ],
  organization: [
    {
      id: "business",
      name: "Business",
      description: "For biotech teams and collaborative regulatory organizations.",
      monthly_price: 275,
      annual_price: 3000,
      features: [
        "Everything in Individual",
        "Team access (up to 5 users)",
        "Shared projects & folders",
        "Priority support",
        "Advanced analytics",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Custom infrastructure for global regulatory organizations.",
      monthly_price: null,
      annual_price: null,
      features: [
        "Everything in Business",
        "Unlimited users",
        "Custom integrations",
        "Dedicated support",
        "SLA & compliance support",
      ],
      popular: false,
    },
  ],
};

interface PricingTableProps {
  initialPlan?: string | null;
  showDashboardLink?: boolean;
}

export function PricingTable({ initialPlan, showDashboardLink = true }: PricingTableProps) {
  const router = useRouter();
  const user = useChatStore((s) => s.user);
  const [annual, setAnnual] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [plans, setPlans] = useState<{ solo: Plan[]; organization: Plan[] } | null>(DEFAULT_PLAN_GROUPS);
  const [toast, setToast] = useState<Toast | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  useEffect(() => {
    function loadSubscription() {
      subscriptionApi.get().then(sub => {
        setSubscription(sub);
        if (sub?.billing_cycle) {
          setAnnual(sub.billing_cycle === "annual");
        }
      }).catch(() => null);
    }

    loadSubscription();
    billingApi.getPlans().then(setPlans).catch(() => setPlans(DEFAULT_PLAN_GROUPS));

    const refreshOnFocus = () => loadSubscription();
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") loadSubscription();
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisible);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, []);

  useEffect(() => {
    if (initialPlan && user && !subscription?.plan) {
      const timer = setTimeout(() => handlePlanClick(initialPlan), 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, subscription, initialPlan]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const activePlanId = subscription?.plan;
  const isActive = subscription?.status === "active" || subscription?.status === "trialing";
  const trialActive = subscription?.status === "trialing";
  const trialEnd = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  async function handlePlanClick(planId: string) {
    if (!user) {
      router.push(`/register?plan=${planId}`);
      return;
    }

    if (planId === "enterprise") {
      router.push("/#contact-us");
      return;
    }

    try {
      setLoading(planId);
      const cycle = annual ? "annual" : "monthly";
      const successUrl = `${window.location.origin}/dashboard/subscription?success=true`;
      const cancelUrl = window.location.href;

      const { checkout_url } = await billingApi.createCheckoutSession(
        planId,
        cycle,
        successUrl,
        cancelUrl
      );

      window.location.href = checkout_url;
    } catch (err) {
      console.error("Checkout error:", err);
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed to initiate checkout" });
    } finally {
      setLoading(null);
    }
  }

  function handleCancel() {
    setCancelConfirmOpen(true);
  }

  async function confirmCancel() {
    setCancelConfirmOpen(false);
    try {
      setCancelLoading(true);
      await billingApi.cancelSubscription();
      setSubscription(prev => prev ? { ...prev, cancel_at_period_end: true } : null);
      setToast({ type: "success", message: "Subscription cancelled. You'll keep access until the end of the billing period." });
    } catch {
      setToast({ type: "error", message: "Failed to cancel subscription. Please try again." });
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleReactivate() {
    try {
      setCancelLoading(true);
      await billingApi.reactivateSubscription();
      setSubscription(prev => prev ? { ...prev, cancel_at_period_end: false } : null);
      setToast({ type: "success", message: "Subscription reactivated successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to reactivate subscription. Please try again." });
    } finally {
      setCancelLoading(false);
    }
  }

  if (!plans) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gs-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isOrgUser = user?.account_type === "organization_member";
  
  // If the user is an org member but the API didn't return any org plans,
  // it means they are not the owner.
  if (isOrgUser && plans.organization.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center">
        <AlertCircle className="w-12 h-12 text-gs-muted mb-4" />
        <h3 className="text-xl font-bold text-gs-text">Billing Management</h3>
        <p className="text-sm text-gs-muted mt-2">
          Only organization owners can manage and view subscription plans.
        </p>
        {showDashboardLink && (
          <button onClick={() => router.push("/dashboard")} className="text-sm text-gs-sky hover:text-gs-blue underline mt-6">
            Back to dashboard
          </button>
        )}
      </div>
    );
  }

  const currentPlans = user ? (isOrgUser ? plans.organization : plans.solo) : [...plans.solo, ...plans.organization];

  return (
    <div className="mx-auto w-full max-w-[1540px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 mb-6 rounded-xl text-sm font-medium border",
          toast.type === "success"
            ? "bg-gs-green/10 border-gs-green/20 text-gs-green"
            : "bg-gs-red/10 border-gs-red/20 text-gs-red"
        )}>
          {toast.type === "success"
            ? <Check className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cancel subscription confirmation */}
      {cancelConfirmOpen && (
        <ConfirmModal
          title="Cancel Subscription"
          message="Are you sure you want to cancel your subscription? You will keep access until the end of the current billing period."
          confirmLabel="Cancel Subscription"
          onCancel={() => setCancelConfirmOpen(false)}
          onConfirm={confirmCancel}
        />
      )}

      {/* Header */}
      <div className="text-center mb-6 space-y-3">
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-extrabold tracking-[0.16em] uppercase text-gs-text">
          Flexible plans. Designed for regulatory teams.
        </h2>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD6FE] bg-[#F1EEFF] px-7 py-2 text-[12px] font-bold uppercase tracking-[0.26em] text-[#4C1D95] shadow-sm dark:border-purple-400/30 dark:bg-purple-500/20 dark:text-purple-100">
          <Star className="h-3.5 w-3.5 fill-current" />
          Introductory pricing - for a limited time
        </div>
        {trialActive && trialEnd && (
          <div className="inline-flex items-center gap-2 bg-gs-blue/10 border border-gs-blue/20 text-gs-blue text-sm font-medium px-4 py-2 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            Free trial active · expires {trialEnd}
          </div>
        )}
        {!trialActive && isActive && periodEnd && (
          <div className={cn(
            "inline-flex items-center gap-2 border text-sm font-medium px-4 py-2 rounded-full",
            subscription?.cancel_at_period_end 
              ? "bg-gs-red/10 border-gs-red/20 text-gs-red" 
              : "bg-gs-green/10 border-gs-green/20 text-gs-green"
          )}>
            {subscription?.cancel_at_period_end ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            {subscription?.cancel_at_period_end ? `Plan ends · ${periodEnd}` : `Plan active · expires ${periodEnd}`}
          </div>
        )}
      </div>

      {/* Billing toggle */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
        <span className={cn("text-sm font-semibold", !annual ? "text-gs-text" : "text-gs-muted")}>Monthly</span>
        <button
          onClick={() => setAnnual((v) => !v)}
          className={cn("relative w-11 h-6 rounded-full transition-colors", annual ? "bg-gs-blue" : "bg-gs-border")}
        >
          <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", annual ? "left-6" : "left-1")} />
        </button>
        <span className={cn("text-sm font-semibold", annual ? "text-gs-text" : "text-gs-muted")}>Annual</span>
        <span className="text-xs font-bold bg-[#EAF7EF] text-[#15803D] px-5 py-1.5 rounded-full shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-400/20">
          Annual includes 1 month free
        </span>
      </div>

      {/* Plan cards */}
      <div className={cn(
        "grid items-stretch gap-5 md:gap-6 xl:gap-7",
        currentPlans.length === 2
          ? "mx-auto max-w-5xl grid-cols-1 lg:grid-cols-2"
          : currentPlans.length === 1
          ? "mx-auto max-w-lg grid-cols-1"
          : "grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3"
      )}>
        {currentPlans.map((plan) => {
          const isEnterprise = plan.id === "enterprise";
          const currentCycle = annual ? "annual" : "monthly";
          const isCurrentPlan = activePlanId === plan.id;
          const isCurrentCycle = subscription?.billing_cycle === currentCycle;
          const isCurrent = isCurrentPlan && isCurrentCycle;
          
          const price = plan.monthly_price;
          const isPopular = Boolean(plan.popular) || plan.id === "business";
          const annualTotal = annual && plan.annual_price !== null ? plan.annual_price : null;
          const Icon = PLAN_ICONS[plan.id] ?? User;
          const firstFeature = plan.features[0] ?? "";
          const hasInherited = firstFeature.toLowerCase().startsWith("everything in");
          const featureHeading = hasInherited
            ? `Includes ${firstFeature.charAt(0).toLowerCase()}${firstFeature.slice(1)}, plus:`
            : "Includes:";
          const listFeatures = hasInherited ? plan.features.slice(1) : plan.features;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex h-full min-w-0 flex-col gap-5 rounded-2xl border bg-gs-card p-5 transition-all duration-300 sm:p-6 xl:p-7 2xl:min-h-[565px]",
                isPopular && !isCurrent ? "border-gs-blue shadow-blue-glow" : "border-gs-border shadow-card",
                isCurrent && "ring-2 ring-gs-green border-gs-green"
              )}
            >
              {isPopular && !isCurrent && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[12px] font-bold uppercase tracking-[0.06em] text-white bg-gs-blue px-7 py-2 rounded-full whitespace-nowrap">
                  Most Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-gs-green px-3 py-1 rounded-full whitespace-nowrap">
                  Current Plan
                </span>
              )}

              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                <span className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl",
                  isEnterprise ? "bg-gs-purple/10 text-gs-purple dark:bg-gs-purple/20 dark:text-purple-300" : "bg-gs-blue/10 text-gs-blue dark:bg-gs-blue/20"
                )}>
                  <Icon className="h-9 w-9" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-bold text-gs-text" title={plan.name}>{plan.name}</h3>
                  <p className="line-clamp-2 max-w-full overflow-hidden text-ellipsis text-[15px] leading-relaxed text-gs-muted mt-1" title={plan.description}>
                    {plan.description}
                  </p>
                </div>
              </div>

              <div className="border-t border-gs-border pt-5">
                {price !== null ? (
                  annual && annualTotal !== null ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2">
                      <div className="min-w-0">
                        <div className="min-w-0">
                          <span className="block max-w-full truncate text-[clamp(2rem,8vw,2.65rem)] sm:text-[clamp(2rem,5vw,2.65rem)] lg:text-[clamp(2rem,4vw,2.65rem)] 2xl:text-[clamp(2rem,2.4vw,2.65rem)] font-bold leading-none text-gs-blue">
                            ${typeof price === 'number' ? price.toLocaleString('en-US', { minimumFractionDigits: price % 1 === 0 ? 0 : 2 }) : price}
                          </span>
                          <span className="mt-1 block max-w-full truncate text-[12px] font-semibold leading-none text-gs-text">USD / month</span>
                        </div>
                        <p className="mt-2 max-w-full truncate text-[13px] font-semibold text-gs-blue" title={plan.id === "business" ? "Up to 5 users included" : "Billed monthly"}>
                          {plan.id === "business" ? "Up to 5 users included" : "Billed monthly"}
                        </p>
                      </div>
                      <div className="min-w-0 border-t border-gs-border pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-4 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0 2xl:border-l 2xl:border-t-0 2xl:pl-4 2xl:pt-0">
                        <div className="min-w-0">
                          <span className="block max-w-full truncate text-[clamp(2rem,8vw,2.65rem)] sm:text-[clamp(2rem,5vw,2.65rem)] lg:text-[clamp(2rem,4vw,2.65rem)] 2xl:text-[clamp(2rem,2.4vw,2.65rem)] font-bold leading-none text-gs-blue">
                            ${annualTotal.toLocaleString("en-US")}
                          </span>
                          <span className="mt-1 block max-w-full truncate text-[12px] font-semibold leading-none text-gs-text">USD / year</span>
                        </div>
                        <p className="mt-2 max-w-full truncate text-[13px] font-semibold text-gs-green" title="Includes 1 month free">
                          Includes 1 month free
                        </p>
                        <p className="max-w-full truncate text-[13px] text-gs-muted" title="with annual billing">with annual billing</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex min-w-0 flex-wrap items-end gap-x-1 gap-y-2 leading-none">
                        <span className="min-w-0 max-w-full truncate text-[40px] font-bold text-gs-blue">
                          ${typeof price === 'number' ? price.toLocaleString('en-US', { minimumFractionDigits: price % 1 === 0 ? 0 : 2 }) : price}
                        </span>
                        <span className="mb-2 max-w-full truncate text-sm text-gs-text">USD / month</span>
                      </div>
                      <p className="mt-2 max-w-full truncate text-[13px] font-semibold text-gs-blue" title={plan.id === "business" ? "Up to 5 users included" : "Billed monthly"}>
                        {plan.id === "business" ? "Up to 5 users included" : "Billed monthly"}
                      </p>
                    </>
                  )
                ) : (
                  <>
                    <p className="max-w-full truncate text-[40px] font-bold leading-none text-[#3B087C] dark:text-purple-300" title="Custom Pricing">Custom Pricing</p>
                    <p className="mt-4 max-w-full truncate text-[15px] text-gs-muted" title="Tailored to your organization's needs.">Tailored to your organization&apos;s needs.</p>
                  </>
                )}
              </div>

              <p className="max-w-full truncate text-[15px] font-bold text-gs-text" title={featureHeading}>{featureHeading}</p>
              <ul className="space-y-2.5 flex-1">
                {listFeatures.map((f) => (
                  <li key={f} className="flex min-w-0 items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-[2px] text-gs-green" strokeWidth={2.5} />
                    <span className="min-w-0 max-w-full truncate text-[15px] text-gs-text" title={f}>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <button
                  onClick={() => !isCurrent && handlePlanClick(plan.id)}
                  className={cn(
                    "flex min-h-[48px] w-full min-w-0 items-center justify-center rounded-[10px] px-3 py-3 text-base font-semibold transition-all",
                    isCurrent
                      ? "bg-gs-green/10 text-gs-green border border-gs-green cursor-default"
                      : isEnterprise
                      ? "bg-gs-navy text-white hover:bg-opacity-90 dark:bg-gs-purple dark:hover:bg-gs-purple/90"
                      : isPopular
                      ? "bg-gs-blue text-white hover:bg-gs-deep-blue shadow-md hover:shadow-lg"
                      : "border border-gs-blue text-gs-blue hover:bg-gs-blue/5 dark:hover:bg-gs-blue/10"
                  )}
                  disabled={isCurrent || (loading !== null)}
                >
                  {loading === plan.id ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="min-w-0 max-w-full truncate">
                      {isCurrent
                        ? subscription?.cancel_at_period_end ? "Ending Soon" : "Subscribed"
                        : isCurrentPlan
                        ? "Switch to " + (annual ? "Annual" : "Monthly")
                        : isEnterprise
                        ? "Contact Sales"
                        : plan.id === "starter" ? "Start Individual Plan" : "Start Business Plan"}
                    </span>
                  )}
                </button>

                {isCurrent && !trialActive && !subscription?.cancel_at_period_end && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold border border-gs-red/20 text-gs-red hover:bg-gs-red/5 transition-all flex items-center justify-center gap-1.5 mt-2"
                  >
                    {cancelLoading ? "Processing..." : "Cancel Subscription"}
                  </button>
                )}

                {isCurrent && subscription?.cancel_at_period_end && (
                  <button
                    onClick={handleReactivate}
                    disabled={cancelLoading}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold border border-gs-blue/20 text-gs-blue hover:bg-gs-blue/5 transition-all flex items-center justify-center gap-1.5 mt-2"
                  >
                    {cancelLoading ? "Processing..." : "Reactivate Subscription"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-gs-border bg-gs-card px-6 py-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_ITEMS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-center gap-4">
            <Icon className="h-9 w-9 shrink-0 text-gs-blue" strokeWidth={2.1} />
            <div>
              <p className="text-[13px] font-bold text-gs-text">{title}</p>
              <p className="text-[12px] leading-snug text-gs-muted">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gs-muted mt-5">
        All plans include secure data handling, multi-model AI access, and global regulatory coverage.
      </p>

      {user && showDashboardLink && (
        <div className="text-center mt-6">
          <button onClick={() => router.push("/dashboard")} className="text-sm text-gs-sky hover:text-gs-blue underline">
            Back to dashboard
          </button>
        </div>
      )}
    </div>
  );
}
