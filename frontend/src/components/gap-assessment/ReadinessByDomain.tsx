import { ChevronRight } from "lucide-react";
import type { GapDomainReadiness } from "../../types";

function DomainBar({ domain, readiness }: GapDomainReadiness) {
  const color =
    readiness >= 80 ? "#10B981" :
    readiness >= 50 ? "#FBBF24" :
    readiness >= 30 ? "#F97316" : "#EF4444";

  return (
    <div className="flex items-center gap-4 group border-b border-[#F1F5F9] last:border-0 py-3">
      <div className="w-[90px] flex items-center justify-end">
        <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-tight text-right">{domain}</span>
      </div>
      <div className="flex-1 relative h-[8px] bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${readiness}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-[44px] flex items-center justify-end">
        <span className="text-[12px] font-bold" style={{ color }}>{readiness}%</span>
      </div>
    </div>
  );
}

function SkeletonBar() {
  return (
    <div className="flex items-center gap-4 border-b border-[#F1F5F9] py-3 animate-pulse">
      <div className="w-[90px] h-3 bg-slate-200 rounded" />
      <div className="flex-1 h-2 bg-slate-100 rounded-full" />
      <div className="w-[44px] h-3 bg-slate-200 rounded" />
    </div>
  );
}

export function ReadinessByDomain({ data, loading }: { data: GapDomainReadiness[]; loading: boolean }) {
  return (
    <div className="lg:col-span-6 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-[16px] font-bold text-[#1E293B]">Readiness by Domain</h3>
        <button className="text-[#2563EB] text-[12px] font-bold flex items-center gap-1 hover:underline">
          Details <ChevronRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-1">{[...Array(6)].map((_, i) => <SkeletonBar key={i} />)}</div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-[13px] font-bold text-[#94A3B8]">No domain data yet.</p>
          <p className="text-[11px] text-[#CBD5E1] mt-1">Run a document analysis in Chat to populate this chart.</p>
        </div>
      ) : (
        <div>{data.map(d => <DomainBar key={d.domain} {...d} />)}</div>
      )}
    </div>
  );
}
