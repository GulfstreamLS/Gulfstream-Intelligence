"use client";

import type { GapSummary } from "../../types";

interface Props {
  gaps: GapSummary[];
}

type InsightColor = "orange" | "purple" | "red";

function severityToColor(severity: string): InsightColor {
  const s = severity.toUpperCase();
  if (s === "CRITICAL") return "red";
  if (s === "HIGH")     return "orange";
  return "purple";
}

function severityLabel(severity: string): string {
  const s = severity.toUpperCase();
  if (s === "CRITICAL") return "Warning";
  if (s === "HIGH")     return "High Risk";
  if (s === "MEDIUM")   return "Recommendation";
  return "Low Risk";
}

const badgeColors: Record<InsightColor, string> = {
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  red:    "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export function RecentInsights({ gaps }: Props) {
  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card h-full overflow-y-auto flex flex-col">
      <h3 className="text-[16px] font-bold text-gs-text mb-6">Recent Insights</h3>

      {gaps.length === 0 ? (
        <p className="text-[13px] text-gs-muted font-medium">
          No gaps identified yet. Analyze a document in chat to see insights here.
        </p>
      ) : (
        <div className="space-y-6">
          {gaps.map((gap) => {
            const color = severityToColor(gap.severity);
            return (
              <div key={String(gap.id)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${badgeColors[color]}`}>
                      {severityLabel(gap.severity)}
                    </span>
                    <span className="text-[10px] font-black text-gs-muted uppercase tracking-widest">{gap.domain}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gs-muted">{gap.severity}</span>
                </div>
                <p className="text-[13px] font-bold text-gs-text leading-snug mb-1">{gap.title}</p>
                <p className="text-[11px] italic font-medium text-gs-muted">{gap.status}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
