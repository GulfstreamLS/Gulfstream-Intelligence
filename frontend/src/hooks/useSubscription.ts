"use client";

import { useState, useEffect, useMemo } from "react";
import { subscriptionApi } from "../lib/api";
import type { Subscription, BillingUsage } from "../types";

export type PlanFeature = "gap_assessment" | "ha_simulation" | "unlimited_uploads" | "document_intelligence";

/**
 * Map plan names to a comparable rank.
 * Trial intentionally maps to rank 1 (starter access), NOT professional.
 * Org subscriptions start at "business" (rank 3) so org members always pass
 * professional gates.
 */
function planRank(plan: string | undefined | null): number {
  switch (plan) {
    case "trial":        return 1;
    case "starter":      return 1;
    case "professional": return 2;
    case "business":     return 3;
    case "enterprise":   return 4;
    default:             return 0;
  }
}

const REQUIRED_RANK: Record<PlanFeature, number> = {
  gap_assessment:         2,   // professional+
  ha_simulation:          2,   // professional+
  unlimited_uploads:      2,   // professional+
  document_intelligence:  2,   // professional+
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
    const rank = planRank(subscription?.plan);
    return (feature: PlanFeature): boolean => rank >= REQUIRED_RANK[feature];
  }, [subscription?.plan]);

  return { subscription, usage, loading, canAccess };
}
