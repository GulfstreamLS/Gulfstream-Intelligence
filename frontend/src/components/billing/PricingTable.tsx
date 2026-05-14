"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, AlertCircle, X } from "lucide-react";
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
}

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
  const [plans, setPlans] = useState<{ solo: Plan[]; organization: Plan[] } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  useEffect(() => {
    // Fetch subscription status and set toggle to match billing cycle
    subscriptionApi.get().then(sub => {
      setSubscription(sub);
      if (sub?.billing_cycle) {
        setAnnual(sub.billing_cycle === "annual");
      }
    }).catch(() => null);

    // Fetch plans
    billingApi.getPlans().then(setPlans).catch(console.error);

    // Sync status from Stripe
    billingApi.syncSubscription()
      .then(() => subscriptionApi.get())
      .then(sub => {
        setSubscription(sub);
        if (sub?.billing_cycle) {
          setAnnual(sub.billing_cycle === "annual");
        }
      })
      .catch(() => null);
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

  const currentPlans = isOrgUser ? plans.organization : plans.solo;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
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
      <div className="text-center mb-10 space-y-3">
        <p className="text-xs font-bold tracking-widest uppercase text-gs-blue">Plans &amp; Pricing</p>
        <h2 className="text-3xl font-bold text-gs-text">
          {isOrgUser ? "Choose a plan for your team" : "Choose your plan"}
        </h2>
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
      <div className={cn("grid gap-6", currentPlans.length === 2 ? "max-w-2xl mx-auto grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
        {currentPlans.map((plan) => {
          const isEnterprise = plan.id === "enterprise";
          const currentCycle = annual ? "annual" : "monthly";
          const isCurrentPlan = activePlanId === plan.id;
          const isCurrentCycle = subscription?.billing_cycle === currentCycle;
          const isCurrent = isCurrentPlan && isCurrentCycle;
          
          const price = annual ? plan.annual_price : plan.monthly_price;
          const isPopular = plan.id === "professional" || plan.id === "business";

          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-2xl p-6 flex flex-col gap-4 border bg-gs-card relative transition-all duration-300",
                isPopular && !isCurrent ? "border-gs-blue shadow-lg scale-[1.02]" : "border-gs-border shadow-card",
                isCurrent && "ring-2 ring-gs-green border-gs-green"
              )}
            >
              {isPopular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-gs-blue px-3 py-1 rounded-full whitespace-nowrap">
                  Most Popular
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
                      <span className="text-4xl font-bold text-gs-text">
                        ${typeof price === 'number' ? price.toLocaleString('en-US', { minimumFractionDigits: price % 1 === 0 ? 0 : 2 }) : price}
                      </span>
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

              <div className="space-y-3">
                <button
                  onClick={() => !isCurrent && handlePlanClick(plan.id)}
                  className={cn(
                    "w-full py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] flex items-center justify-center",
                    isCurrent
                      ? "bg-gs-green/10 text-gs-green border border-gs-green cursor-default"
                      : isEnterprise
                      ? "bg-gs-navy text-white hover:bg-opacity-90"
                      : isPopular
                      ? "bg-gs-blue text-white hover:bg-gs-deep-blue shadow-md hover:shadow-lg"
                      : "border border-gs-blue text-gs-blue hover:bg-gs-blue/5"
                  )}
                  disabled={isCurrent || (loading !== null)}
                >
                  {loading === plan.id ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isCurrent ? (
                    subscription?.cancel_at_period_end ? "Ending Soon" : "Subscribed"
                  ) : isCurrentPlan ? (
                    "Switch to " + (annual ? "Annual" : "Monthly")
                  ) : isEnterprise ? (
                    "Contact Sales"
                  ) : user ? (
                    "Upgrade Now"
                  ) : (
                    "Sign Up Now"
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

      <p className="text-center text-sm text-gs-muted mt-8">
        Secure data handling and global regulatory coverage.
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
