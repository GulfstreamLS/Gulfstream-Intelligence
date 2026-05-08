import { ChevronRight } from "lucide-react";
import type { GapSeverityStat } from "../../types";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH:     "#F97316",
  MEDIUM:   "#FBBF24",
  LOW:      "#10B981",
};
const SEVERITY_BG: Record<string, string> = {
  CRITICAL: "bg-[#EF4444]",
  HIGH:     "bg-[#F97316]",
  MEDIUM:   "bg-[#FBBF24]",
  LOW:      "bg-[#10B981]",
};

function LegendItem({ label, count, percentage, color }: { label: string; count: number; percentage: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-[12px] font-bold text-[#0F172A]">{count} ({percentage}%)</span>
    </div>
  );
}

export function GapSeverityDonut({ data, loading }: { data: GapSeverityStat[]; loading: boolean }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  // Build SVG dasharray segments from percentages
  const circumference = 100;
  let offset = 0;
  const segments = data.map(d => {
    const dash = (d.percentage / 100) * circumference;
    const seg  = { ...d, dash, offset };
    offset += dash;
    return seg;
  });

  if (loading) {
    return (
      <div className="lg:col-span-3 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col items-center animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded mb-10 self-start" />
        <div className="w-48 h-48 rounded-full bg-slate-100 mb-10" />
        <div className="w-full space-y-3.5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-slate-100 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-3 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col items-center">
      <h3 className="text-[16px] font-bold text-[#1E293B] w-full mb-10">Gap Severity Distribution</h3>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center w-full">
          <div className="w-48 h-48 rounded-full border-4 border-dashed border-[#E2E8F0] flex items-center justify-center mb-10">
            <span className="text-[12px] font-bold text-[#CBD5E1]">No data</span>
          </div>
        </div>
      ) : (
        <div className="relative w-48 h-48 mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            {segments.map(seg => (
              <circle
                key={seg.severity}
                cx="18" cy="18" r="16"
                fill="none"
                stroke={SEVERITY_COLORS[seg.severity] ?? "#CBD5E1"}
                strokeWidth="4"
                strokeDasharray={`${seg.dash}, ${circumference}`}
                strokeDashoffset={-seg.offset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Total</span>
            <span className="text-[32px] font-bold text-[#0F172A] leading-none my-1">{total}</span>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Gaps</span>
          </div>
        </div>
      )}

      <div className="w-full space-y-3.5">
        {data.length > 0 ? data.map(d => (
          <LegendItem
            key={d.severity}
            label={d.severity}
            count={d.count}
            percentage={d.percentage}
            color={SEVERITY_BG[d.severity] ?? "bg-slate-300"}
          />
        )) : ["CRITICAL","HIGH","MEDIUM","LOW"].map(s => (
          <LegendItem key={s} label={s} count={0} percentage={0} color={SEVERITY_BG[s]} />
        ))}
      </div>

      <button className="mt-auto pt-8 text-[#2563EB] text-[13px] font-bold flex items-center gap-1 hover:underline w-full">
        View all gaps <ChevronRight size={16} />
      </button>
    </div>
  );
}
