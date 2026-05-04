"use client";

import { useState } from "react";
import {
  ChevronDown,
  FileText,
  Download,
  Zap,
  Eye,
  AlertTriangle,
  Globe,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";

type ViewMode = "program" | "portfolio";

const STAT_ROWS = [
  {
    icon: CheckCircle2,
    iconColor: "text-gs-blue",
    label: "Readiness Score",
    value: "72%",
    valueColor: "text-gs-text",
  },
  {
    icon: AlertCircle,
    iconColor: "text-gs-orange",
    label: "Critical Gaps",
    value: "7",
    valueColor: "text-gs-text",
  },
  {
    icon: Globe,
    iconColor: "text-gs-blue",
    label: "Regions",
    value: "FDA, EMA",
    valueColor: "text-gs-text",
  },
  {
    icon: ShieldAlert,
    iconColor: "text-gs-orange",
    label: "Risk Level",
    value: "Moderate",
    valueColor: "text-gs-orange",
  },
  {
    icon: CheckCircle2,
    iconColor: "text-gs-muted",
    label: "Confidence",
    value: "Medium",
    valueColor: "text-gs-text",
  },
];

const ACTION_BUTTONS = [
  { icon: FileText, label: "Generate Full Summary", primary: true },
  { icon: Download, label: "Export (PDF / Word)", primary: false },
  { icon: Zap, label: "Run Simulation", primary: false },
  { icon: Eye, label: "View Gap Details", primary: false },
];

export function RegulatoryCoreSummary() {
  const [view, setView] = useState<ViewMode>("program");

  return (
    <div className="card p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-gs-text">
              Regulatory Core Summary
            </h2>
            <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-gs-blue text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800">
              Updated 2h ago
            </span>
          </div>
          <p className="mt-1 text-sm text-gs-muted">
            Real-time view of your program&apos;s regulatory position, risks, and readiness.
          </p>
        </div>

        {/* View toggle + dropdown */}
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <div className="flex rounded-lg border border-gs-border overflow-hidden">
            {(["program", "portfolio"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                  view === v
                    ? "bg-gs-blue text-white"
                    : "bg-gs-card text-gs-muted hover:text-gs-text"
                )}
              >
                {v === "program" ? "Program View" : "Portfolio View"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-gs-muted">
            <span>Viewing:</span>
            <button className="flex items-center gap-1 font-medium text-gs-text hover:text-gs-blue transition-colors">
              AAV Gene Therapy Program
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — qualitative info */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Program Status */}
          <div>
            <p className="text-xs font-medium tracking-wide uppercase text-gs-muted mb-2">
              Program Status
            </p>
            <p className="text-sm text-gs-text">
              <span className="font-semibold text-gs-orange">Moderate</span> readiness across FDA and EMA.
            </p>
          </div>

          {/* Regulatory Impact */}
          <div>
            <p className="text-xs font-medium tracking-wide uppercase text-gs-muted mb-2">
              Regulatory Impact
            </p>
            <p className="text-sm text-gs-text leading-relaxed">
              Potential delays in submission timelines and increased likelihood of health authority questions.
            </p>
          </div>

          {/* Top Risks */}
          <div>
            <p className="text-xs font-medium tracking-wide uppercase text-gs-muted mb-2">
              Top Risks
            </p>
            <ul className="flex flex-col gap-1.5">
              {["CMC readiness gaps", "Incomplete nonclinical coverage", "Regional misalignment"].map(
                (risk) => (
                  <li key={risk} className="flex items-start gap-2 text-sm text-gs-text">
                    <AlertTriangle className="w-4 h-4 text-gs-red shrink-0 mt-0.5" />
                    {risk}
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Recommended Actions */}
          <div>
            <p className="text-xs font-medium tracking-wide uppercase text-gs-muted mb-2">
              Recommended Actions
            </p>
            <ul className="flex flex-col gap-1.5">
              {[
                "Strengthen CMC package",
                "Align global strategy (FDA vs EMA)",
                "Run simulation on key risk areas",
              ].map((action) => (
                <li key={action} className="flex items-start gap-2 text-sm text-gs-text">
                  <span className="w-1.5 h-1.5 rounded-full bg-gs-blue shrink-0 mt-2" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right — stats */}
        <div className="flex flex-col gap-3 bg-gs-bg rounded-xl p-4">
          {STAT_ROWS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center justify-between py-2 border-b border-gs-border last:border-0"
              >
                <div className="flex items-center gap-2 text-sm text-gs-muted">
                  <Icon className={cn("w-4 h-4 shrink-0", stat.iconColor)} />
                  {stat.label}
                </div>
                <span className={cn("text-sm font-semibold", stat.valueColor)}>
                  {stat.value}
                </span>
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
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold transition-colors min-h-[44px]",
                btn.primary
                  ? "btn-primary"
                  : "bg-gs-card border border-gs-border text-gs-text hover:bg-gs-bg"
              )}
            >
              <Icon className="w-4 h-4" />
              {btn.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
