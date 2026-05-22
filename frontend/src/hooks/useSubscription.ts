"use client";

import { useState, useEffect, useMemo } from "react";
import { subscriptionApi } from "../lib/api";
import type { Subscription, BillingUsage } from "../types";

export type PlanFeature = "gap_assessment" | "ha_simulation" | "unlimited_uploads" | "document_intelligence";

/**
 * Map plan names to a comparable rank.
 * Active trial users get full feature access until the trial expires.
 * Org subscriptions start at "business" (rank 3) so org members always pass
 * Individual gates.
 */
function planRank(plan: string | undefined | null): number {
  switch (plan) {
    case "trial":        return 4;
    case "starter":      return 2;
    case "professional": return 2; // legacy alias for existing records
    case "business":     return 3;
    case "enterprise":   return 4;
    default:             return 0;
  }
}

const REQUIRED_RANK: Record<PlanFeature, number> = {
  gap_assessment:         2,   // Individual+
  ha_simulation:          2,   // Individual+
  unlimited_uploads:      2,   // Individual+
  document_intelligence:  2,   // Individual+
};

export interface SubscriptionState {
  subscription: Subscription | null;
  usage: BillingUsage | null;
  loading: boolean;
  canAccess: (feature: PlanFeature) => boolean;
}

export function useSubscription(): SubscriptionState {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage,        setUsage]        = useState<BillingUsage | null>(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      subscriptionApi.get().catch(() => null),
      subscriptionApi.getUsage().catch(() => null),
    ]).then(([sub, use]) => {
      setSubscription(sub);
      setUsage(use);
    }).finally(() => setLoading(false));
  }, []);

  const canAccess = useMemo(() => {
    const isActiveSubscription =
      subscription?.status === "active" ||
      (
        subscription?.status === "trialing" &&
        subscription?.trial_ends_at != null &&
        new Date(subscription.trial_ends_at) > new Date()
      );
    if (!isActiveSubscription) return () => false;

    const rank = planRank(subscription?.plan);
    return (feature: PlanFeature): boolean => rank >= REQUIRED_RANK[feature];
  }, [subscription?.plan, subscription?.status, subscription?.trial_ends_at]);

  return { subscription, usage, loading, canAccess };
}
