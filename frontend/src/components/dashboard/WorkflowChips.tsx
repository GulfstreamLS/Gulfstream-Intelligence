"use client";

import { useRouter } from "next/navigation";
import { FileText, Brain, Scale, BookOpen } from "lucide-react";

interface WorkflowChip {
  label: string;
  icon: React.ElementType;
  message: string;
}

const WORKFLOWS: WorkflowChip[] = [
  {
    label: "IND readiness (FDA / EMA)",
    icon: FileText,
    message: "What are the key requirements for IND readiness across FDA and EMA? Please provide a comprehensive overview of the non-clinical, clinical, and CMC expectations.",
  },
  {
    label: "Scientific advice prep (EMA)",
    icon: Brain,
    message: "Help me prepare for an EMA scientific advice meeting. What key questions should I address and what supporting data should I have ready?",
  },
  {
    label: "Benefit-risk assessment",
    icon: Scale,
    message: "Guide me through a structured benefit-risk assessment framework. What are the key dimensions to evaluate and how should I present the analysis to health authorities?",
  },
  {
    label: "CTD Module 3 gaps",
    icon: BookOpen,
    message: "Identify common gaps in CTD Module 3 (Quality) submissions and provide guidance on what CMC data is typically required by FDA and EMA.",
  },
];

export function WorkflowChips() {
  const router = useRouter();

  function handleClick(message: string) {
    sessionStorage.setItem("pendingChatMessage", message);
    router.push("/dashboard/chat");
  }

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
              onClick={() => handleClick(w.message)}
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
