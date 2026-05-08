import { AlertCircle, CheckCircle2, ClipboardCheck, FlaskConical, ChevronRight } from "lucide-react";
import type { GapActionItem } from "../../types";

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  High:     <AlertCircle className="text-[#EF4444]" />,
  Medium:   <ClipboardCheck className="text-[#F97316]" />,
  Low:      <FlaskConical className="text-[#FBBF24]" />,
  Critical: <AlertCircle className="text-[#EF4444]" />,
};

function NextStep({ title, description, priority }: GapActionItem) {
  return (
    <div className="flex items-start gap-4 p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl hover:border-blue-200 transition-all cursor-pointer group">
      <div className="mt-0.5 shrink-0">{PRIORITY_ICONS[priority] ?? <CheckCircle2 className="text-[#10B981]" />}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black text-[#1E293B] uppercase tracking-tight mb-1 group-hover:text-blue-600 truncate">{title}</p>
        <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-tighter leading-tight line-clamp-2">{description}</p>
      </div>
      <ChevronRight size={16} className="text-[#CBD5E1] mt-2 shrink-0" />
    </div>
  );
}

function SkeletonStep() {
  return (
    <div className="flex items-start gap-4 p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl animate-pulse">
      <div className="w-5 h-5 rounded-full bg-slate-200 mt-0.5 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-2 bg-slate-100 rounded w-full" />
      </div>
    </div>
  );
}

export function GapNextSteps({ data, loading }: { data: GapActionItem[]; loading: boolean }) {
  return (
    <div className="lg:col-span-3 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
      <h3 className="text-[16px] font-bold text-[#1E293B] mb-8">Next Steps</h3>
      <div className="space-y-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonStep key={i} />)
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 size={28} className="text-[#CBD5E1] mb-3" />
            <p className="text-[13px] font-bold text-[#94A3B8]">No actions yet.</p>
            <p className="text-[11px] text-[#CBD5E1] mt-1">Run a document analysis in Chat to generate recommendations.</p>
          </div>
        ) : (
          data.map((step, i) => <NextStep key={i} {...step} />)
        )}
      </div>
      <button className="mt-10 text-[#2563EB] text-[13px] font-bold flex items-center gap-1 hover:underline">
        View all insights <ChevronRight size={16} />
      </button>
    </div>
  );
}
