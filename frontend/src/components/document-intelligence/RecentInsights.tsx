
type InsightColor = "orange" | "purple" | "red";

interface InsightItemData {
  type: string;
  src: string;
  date: string;
  text: string;
  sub: string;
  color: InsightColor;
}

const INSIGHTS: InsightItemData[] = [
  {
    type: "Requirement",
    src: "FDA",
    date: "May 10, 2025",
    text: "Process validation should be established using a lifecycle approach.",
    sub: "Q8(R2) Pharmaceutical Development",
    color: "orange",
  },
  {
    type: "Recommendation",
    src: "EMA",
    date: "May 8, 2025",
    text: "Implement risk-based thinking throughout the product lifecycle.",
    sub: "Reflection Paper on Risk-Based Quality Management",
    color: "purple",
  },
  {
    type: "Warning",
    src: "FDA",
    date: "May 6, 2025",
    text: "Incomplete stability data for the proposed shelf life.",
    sub: "Assessment Report - Oncology IND Application",
    color: "red",
  },
];

const badgeColors: Record<InsightColor, string> = {
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  red:    "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

function InsightItem({ type, src, date, text, sub, color }: InsightItemData) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${badgeColors[color]}`}>
            {type}
          </span>
          <span className="text-[10px] font-black text-gs-muted uppercase tracking-widest">{src}</span>
        </div>
        <span className="text-[10px] font-bold text-gs-muted">{date}</span>
      </div>
      <p className="text-[13px] font-bold text-gs-text leading-snug mb-1">{text}</p>
      <p className="text-[11px] italic font-medium text-gs-muted">{sub}</p>
    </div>
  );
}

export function RecentInsights() {
  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-6">Recent Insights</h3>
      <div className="space-y-6">
        {INSIGHTS.map((insight) => (
          <InsightItem key={`${insight.type}-${insight.src}-${insight.date}`} {...insight} />
        ))}
      </div>
    </div>
  );
}
