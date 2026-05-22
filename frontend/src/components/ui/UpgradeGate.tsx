"use client";

import { useRouter } from "next/navigation";
import { Lock, ArrowLeft } from "lucide-react";
import type { PlanFeature } from "../../hooks/useSubscription";

const FEATURE_META: Record<PlanFeature, { name: string; requiredPlan: string; description: string }> = {
  gap_assessment: {
    name: "Global Gap Assessment",
    requiredPlan: "Individual",
    description:
      "Analyse regulatory gaps across all your documents in one view, with domain-level readiness scores and prioritised next steps.",
  },
  ha_simulation: {
    name: "Health Authority Simulation",
    requiredPlan: "Individual",
    description:
      "Simulate FDA, EMA, and other health authority interactions before your submission to anticipate questions and strengthen your dossier.",
  },
  unlimited_uploads: {
    name: "Unlimited File Uploads",
    requiredPlan: "Individual",
    description:
      "Upload unlimited documents per month for deep regulatory analysis.",
  },
  document_intelligence: {
    name: "Document Intelligence",
    requiredPlan: "Individual",
    description:
      "Unlock AI-powered extraction, gap detection, and regulatory insights across all your uploaded documents in one centralised dashboard.",
  },
};

interface UpgradeGateProps {
  feature: PlanFeature;
  /** Pass false to show the lock screen, true (or omit) to render children normally. */
  canAccess: boolean;
  children: React.ReactNode;
}

export function UpgradeGate({ feature, canAccess, children }: UpgradeGateProps) {
  const router = useRouter();

  if (canAccess) return <>{children}</>;

  const { name, requiredPlan, description } = FEATURE_META[feature];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16">
      <div className="flex flex-col items-center gap-5 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-gs-blue/10 dark:bg-gs-blue/20 flex items-center justify-center">
          <Lock className="w-7 h-7 text-gs-blue" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gs-text">{name}</h2>
          <p className="text-sm text-gs-muted leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-gs-blue/10 dark:bg-gs-blue/20 rounded-full">
          <span className="text-xs font-bold text-gs-blue uppercase tracking-wide">
            {requiredPlan} plan required
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <button
            onClick={() => router.push("/dashboard/subscription")}
            className="btn-primary px-8 py-2.5 text-sm"
          >
            Upgrade to {requiredPlan}
          </button>
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-gs-muted border border-gs-border rounded-button hover:text-gs-text hover:bg-gs-bg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
