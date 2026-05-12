"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, ShieldAlert, Clock, FileText, AlertTriangle } from "lucide-react";
import type { GapActionItem } from "../../types";

interface Props {
  actions: GapActionItem[];
}

type ImpactLevel = "High Impact" | "Medium Impact" | "Low Impact";

function priorityToImpact(priority: string): ImpactLevel {
  const p = priority.toLowerCase();
  if (p === "high" || p === "critical") return "High Impact";
  if (p === "medium")                   return "Medium Impact";
  return "Low Impact";
}

const ICONS = [ShieldAlert, Clock, FileText, AlertTriangle];
const ICON_BG = [
  "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
];

const impactColors: Record<ImpactLevel, string> = {
  "High Impact":   "text-gs-red",
  "Medium Impact": "text-gs-orange",
  "Low Impact":    "text-gs-green",
};

const DEFAULT_LIMIT = 3;

export function RecommendedActions({ actions }: Props) {
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? actions : actions.slice(0, DEFAULT_LIMIT);
  const hasMore = actions.length > DEFAULT_LIMIT;

  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-6">Recommended Actions</h3>

      {actions.length === 0 ? (
        <p className="text-[13px] text-gs-muted font-medium">
          No actions available yet. Analyze a document in chat to see recommendations.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {visible.map((action, i) => {
              const Icon   = ICONS[i % ICONS.length];
              const iconBg = ICON_BG[i % ICON_BG.length];
              const impact = priorityToImpact(action.priority);
              return (
                <div
                  key={action.title}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-gs-bg transition-colors cursor-pointer group"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gs-text leading-snug mb-1">{action.description}</p>
                    <p className={`text-[11px] font-bold ${impactColors[impact]}`}>{impact}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gs-muted shrink-0 mt-1 group-hover:text-gs-text transition-colors" />
                </div>
              );
            })}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-gs-blue text-[13px] font-bold flex items-center gap-1 mt-4 hover:underline"
            >
              {showAll ? "Show less" : `View all actions (${actions.length})`}
              {showAll ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </>
      )}
    </div>
  );
}
