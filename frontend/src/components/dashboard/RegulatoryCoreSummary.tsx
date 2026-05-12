"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Download, Zap, Eye, AlertTriangle,
  Globe, ShieldAlert, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { assessmentApi } from "../../lib/api";
import type { GapAssessmentResponse } from "../../types";

function riskLevel(criticalGaps: number): { label: string; color: string } {
  if (criticalGaps >= 5) return { label: "High",     color: "text-gs-red" };
  if (criticalGaps >= 2) return { label: "Moderate", color: "text-gs-orange" };
  return                        { label: "Low",       color: "text-gs-green" };
}

function readinessLabel(pct: number): string {
  if (pct >= 80) return "Strong readiness across submission areas.";
  if (pct >= 60) return "Moderate readiness — some gaps require attention.";
  if (pct >= 40) return "Partial readiness — significant gaps identified.";
  return               "Early stage — comprehensive gap work needed.";
}

const ACTION_BUTTONS = [
  { icon: FileText, label: "Generate Full Summary", primary: true,  href: "/dashboard/chat" },
  { icon: Download, label: "Export (PDF / Word)",   primary: false, href: "/dashboard/documents"      },
  { icon: Zap,      label: "Run Simulation",        primary: false, href: "/dashboard/ha-simulation"  },
  { icon: Eye,      label: "View Gap Details",      primary: false, href: "/dashboard/gap-assessment" },
];

export function RegulatoryCoreSummary() {
  const router = useRouter();
  const [data,    setData]    = useState<GapAssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assessmentApi.getGlobalGap()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const readiness     = data?.overall_readiness  ?? 0;
  const criticalCount = data?.critical_gaps_count ?? 0;
  const highCount     = data?.high_priority_count ?? 0;
  const risk          = riskLevel(criticalCount);

  const topAuthorities = data
    ? [...new Set((data.domain_readiness ?? []).map((d) => d.domain).slice(0, 3))].join(", ")
    : "—";

  const topRisks    = (data?.top_gaps ?? []).slice(0, 3).map((g) => g.title);
  const recActions  = (data?.next_steps ?? []).slice(0, 3).map((a) => a.description);

  const statRows = [
    { icon: CheckCircle2, iconColor: "text-gs-blue",   label: "Readiness Score", value: loading ? "…" : `${readiness}%`,        valueColor: "text-gs-text" },
    { icon: AlertCircle,  iconColor: "text-gs-orange", label: "Critical Gaps",   value: loading ? "…" : String(criticalCount),   valueColor: "text-gs-text" },
    { icon: AlertCircle,  iconColor: "text-gs-red",    label: "High Priority",   value: loading ? "…" : String(highCount),       valueColor: "text-gs-text" },
    { icon: Globe,        iconColor: "text-gs-blue",   label: "Domains",         value: loading ? "…" : (topAuthorities || "—"), valueColor: "text-gs-text" },
    { icon: ShieldAlert,  iconColor: "text-gs-orange", label: "Risk Level",      value: loading ? "…" : risk.label,              valueColor: risk.color },
  ];

  return (
    <div className="card p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gs-text">Regulatory Core Summary</h2>
          <p className="mt-1 text-sm text-gs-muted">
            Real-time view of your program&apos;s regulatory position, risks, and readiness.
          </p>
        </div>

        {!loading && data && (
          <div className="shrink-0">
            <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-gs-blue text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800">
              {readiness}% Readiness
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-gs-border animate-pulse" />)}
        </div>
      ) : !data || (criticalCount === 0 && readiness === 0) ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <ShieldAlert className="w-10 h-10 text-gs-border" />
          <p className="text-[14px] font-bold text-gs-text">No assessment data yet.</p>
          <p className="text-[13px] text-gs-muted font-medium">
            Analyze documents in Regulatory Chat to see your regulatory readiness here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — qualitative info */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium tracking-wide uppercase text-gs-muted mb-2">Program Status</p>
                <p className="text-sm text-gs-text">
                  <span className={cn("font-semibold", risk.color)}>{risk.label}</span>{" "}
                  {readinessLabel(readiness)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium tracking-wide uppercase text-gs-muted mb-2">Regulatory Impact</p>
                <p className="text-sm text-gs-text leading-relaxed">
                  {criticalCount > 0
                    ? `${criticalCount} critical and ${highCount} high-priority gaps may impact submission timelines.`
                    : "No critical gaps detected. Submission readiness is on track."}
                </p>
              </div>

              {topRisks.length > 0 && (
                <div>
                  <p className="text-xs font-medium tracking-wide uppercase text-gs-muted mb-2">Top Risks</p>
                  <ul className="flex flex-col gap-1.5">
                    {topRisks.map((risk) => (
                      <li key={risk} className="flex items-start gap-2 text-sm text-gs-text">
                        <AlertTriangle className="w-4 h-4 text-gs-red shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recActions.length > 0 && (
                <div>
                  <p className="text-xs font-medium tracking-wide uppercase text-gs-muted mb-2">Recommended Actions</p>
                  <ul className="flex flex-col gap-1.5">
                    {recActions.map((action) => (
                      <li key={action} className="flex items-start gap-2 text-sm text-gs-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-gs-blue shrink-0 mt-2" />
                        <span className="line-clamp-2">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right — stats */}
            <div className="flex flex-col gap-3 bg-gs-bg rounded-xl p-4">
              {statRows.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center justify-between py-2 border-b border-gs-border last:border-0">
                    <div className="flex items-center gap-2 text-sm text-gs-muted">
                      <Icon className={cn("w-4 h-4 shrink-0", stat.iconColor)} />
                      {stat.label}
                    </div>
                    <span className={cn("text-sm font-semibold", stat.valueColor)}>{stat.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gs-border">
            {ACTION_BUTTONS.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.label}
                  onClick={() => router.push(btn.href)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold transition-colors min-h-[44px]",
                    btn.primary ? "btn-primary" : "bg-gs-card border border-gs-border text-gs-text hover:bg-gs-bg"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {btn.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
