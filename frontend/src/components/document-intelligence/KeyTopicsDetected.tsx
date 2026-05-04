import { ChevronRight } from "lucide-react";

interface TopicItem {
  label: string;
  count: number;
}

const TOPICS: TopicItem[] = [
  { label: "Process Validation",  count: 32 },
  { label: "Stability",           count: 28 },
  { label: "Risk Management",     count: 24 },
  { label: "Quality by Design",   count: 18 },
  { label: "Clinical Endpoints",  count: 16 },
  { label: "Data Integrity",      count: 14 },
  { label: "Change Control",      count: 12 },
];

export function KeyTopicsDetected() {
  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-6">Key Topics Detected</h3>
      <div className="space-y-[10px]">
        {TOPICS.map((topic) => (
          <div key={topic.label} className="flex items-center justify-between py-1">
            <span className="text-[13px] font-bold text-gs-muted">{topic.label}</span>
            <span className="bg-gs-bg px-2 py-0.5 rounded text-[11px] font-black text-gs-blue border border-gs-border">
              {topic.count}
            </span>
          </div>
        ))}
      </div>
      <button className="text-gs-blue text-[13px] font-bold flex items-center gap-1 mt-6 hover:underline">
        View all topics <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
