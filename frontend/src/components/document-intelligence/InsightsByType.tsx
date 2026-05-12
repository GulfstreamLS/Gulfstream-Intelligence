"use client";

import type { GapSeverityStat } from "../../types";

interface Props {
  severities: GapSeverityStat[];
}

interface ProgressRowProps {
  label: string;
  val: number;
  max: number;
  color: string;
}

function ProgressRow({ label, val, max, color }: ProgressRowProps) {
  const pct = max > 0 ? (val / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-[12px] font-bold mb-2">
        <span className="text-gs-muted">{label}</span>
        <span className="text-gs-text">{val}</span>
      </div>
      <div className="h-1.5 w-full bg-gs-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: "Critical",     color: "bg-red-500" },
  HIGH:     { label: "High Risk",    color: "bg-gs-orange" },
  MEDIUM:   { label: "Medium Risk",  color: "bg-gs-blue" },
  LOW:      { label: "Low Risk",     color: "bg-gs-green" },
};

const ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function InsightsByType({ severities }: Props) {
  const totalCount = severities.reduce((s, x) => s + x.count, 0);

  const rows = ORDER.map((key) => {
    const stat = severities.find((s) => s.severity.toUpperCase() === key);
    const cfg  = SEVERITY_CONFIG[key];
    return { label: cfg.label, val: stat?.count ?? 0, color: cfg.color };
  });

  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-8">Insights by Type</h3>

      {totalCount === 0 ? (
        <p className="text-[13px] text-gs-muted font-medium">No insights yet.</p>
      ) : (
        <div className="space-y-6">
          {rows.map((r) => (
            <ProgressRow key={r.label} label={r.label} val={r.val} max={totalCount} color={r.color} />
          ))}
        </div>
      )}
    </div>
  );
}
