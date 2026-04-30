"use client";

import { FileText, Brain, Scale, BookOpen } from "lucide-react";

interface WorkflowChip {
  label: string;
  icon: React.ElementType;
}

const WORKFLOWS: WorkflowChip[] = [
  { label: "IND readiness (FDA / EMA)", icon: FileText },
  { label: "Scientific advice prep (EMA)", icon: Brain },
  { label: "Benefit-risk assessment", icon: Scale },
  { label: "CTD Module 3 gaps", icon: BookOpen },
];

export function WorkflowChips() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium tracking-wide uppercase text-gs-muted">
        Common regulatory workflows
      </p>
      <div className="flex flex-wrap gap-2">
        {WORKFLOWS.map((w) => {
          const Icon = w.icon;
          return (
            <button
              key={w.label}
              className="flex items-center gap-2 px-3 py-2 bg-gs-card border border-gs-border rounded-lg text-sm text-gs-text font-medium hover:border-gs-blue hover:text-gs-blue hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors min-h-[44px]"
            >
              <Icon className="w-4 h-4 text-gs-muted shrink-0" />
              {w.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
