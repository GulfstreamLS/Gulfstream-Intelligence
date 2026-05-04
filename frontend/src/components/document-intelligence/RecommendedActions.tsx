import { ChevronRight, ShieldAlert, Clock, FileText, AlertTriangle } from "lucide-react";

type ImpactLevel = "High Impact" | "Medium Impact" | "Low Impact";

interface ActionItem {
  icon: React.ElementType;
  iconBg: string;
  text: string;
  impact: ImpactLevel;
}

const ACTIONS: ActionItem[] = [
  {
    icon: ShieldAlert,
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    text: "Address 3 critical gaps related to process validation requirements",
    impact: "High Impact",
  },
  {
    icon: Clock,
    iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    text: "Review 5 recommendations on stability protocol design",
    impact: "Medium Impact",
  },
  {
    icon: FileText,
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    text: "Update labeling to align with latest FDA guidance",
    impact: "Medium Impact",
  },
  {
    icon: AlertTriangle,
    iconBg: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    text: "Consider implementing additional risk mitigation strategies",
    impact: "Low Impact",
  },
];

const impactColors: Record<ImpactLevel, string> = {
  "High Impact":   "text-gs-red",
  "Medium Impact": "text-gs-orange",
  "Low Impact":    "text-gs-green",
};

export function RecommendedActions() {
  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-6">Recommended Actions</h3>
      <div className="space-y-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.text}
              className="flex items-start gap-4 p-3 rounded-xl hover:bg-gs-bg transition-colors cursor-pointer group"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${action.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gs-text leading-snug mb-1">{action.text}</p>
                <p className={`text-[11px] font-bold ${impactColors[action.impact]}`}>{action.impact}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gs-muted shrink-0 mt-1 group-hover:text-gs-text transition-colors" />
            </div>
          );
        })}
      </div>
      <button className="text-gs-blue text-[13px] font-bold flex items-center gap-1 mt-4 hover:underline">
        View all actions <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
