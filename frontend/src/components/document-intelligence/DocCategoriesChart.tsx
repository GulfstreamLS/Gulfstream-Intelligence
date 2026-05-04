import { ChevronRight } from "lucide-react";

interface LegendItemProps {
  color: string;
  label: string;
  val: string;
  pct: string;
}

function LegendItem({ color, label, val, pct }: LegendItemProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-bold text-gs-muted whitespace-nowrap">{label}</span>
      </div>
      <span className="text-[11px] font-black text-gs-text">
        {val} <span className="font-bold text-gs-muted ml-1">({pct})</span>
      </span>
    </div>
  );
}

export function DocCategoriesChart() {
  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-8">Document Categories</h3>
      <div className="flex items-center gap-8">
        {/* Donut chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="4" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="#2563EB" strokeWidth="4" strokeDasharray="33, 100" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeDasharray="22, 100" strokeDashoffset="-33" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="16, 100" strokeDashoffset="-55" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="14, 100" strokeDashoffset="-71" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[26px] font-black text-gs-text leading-none">128</span>
            <span className="text-[10px] font-bold text-gs-muted uppercase mt-1">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          <LegendItem color="#2563EB" label="Regulatory Guidance" val="42" pct="33%" />
          <LegendItem color="#8B5CF6" label="Labeling & SmPC"     val="28" pct="22%" />
          <LegendItem color="#10B981" label="Clinical Protocols"  val="20" pct="16%" />
          <LegendItem color="#F59E0B" label="Assessment Reports"  val="18" pct="14%" />
        </div>
      </div>

      <button className="text-gs-blue text-[13px] font-bold flex items-center gap-1 mt-8 hover:underline">
        View all categories <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
