import { ChevronRight } from "lucide-react";
import type { GapAssessmentResponse } from "../../types";

function StatCard({
  title, value, sub, color, trend, barPct, loading,
}: {
  title: string; value: string | number; sub: string; color: string;
  trend?: string; barPct?: number; loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white p-7 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col h-full animate-pulse">
        <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
        <div className="h-8 w-16 bg-slate-200 rounded mb-2" />
        <div className="h-2 w-full bg-slate-100 rounded mt-3" />
        <div className="mt-auto pt-7 h-3 w-20 bg-slate-100 rounded" />
      </div>
    );
  }
  return (
    <div className="bg-white p-7 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col h-full">
      <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] mb-4">{title}</span>
      <div className="flex items-baseline gap-3 mb-1">
        <h4 className="text-[30px] font-bold text-[#0F172A] leading-none tracking-tight">{value}</h4>
        <span className={`text-[12px] font-bold ${color}`}>{sub}</span>
      </div>
      {barPct !== undefined && (
        <div className="w-full bg-[#F1F5F9] h-[5px] rounded-full mt-3 overflow-hidden">
          <div className="bg-[#10B981] h-full transition-all duration-500" style={{ width: `${barPct}%` }} />
        </div>
      )}
      <div className="mt-auto pt-7 flex justify-between items-center">
        <span className={`text-[10px] font-bold uppercase tracking-[0.05em] ${trend ? "text-[#10B981]" : "text-[#94A3B8]"}`}>
          {trend || "View details"}
        </span>
        <ChevronRight size={14} className="text-[#CBD5E1]" />
      </div>
    </div>
  );
}

export function GapStatCards({ data, loading }: { data: GapAssessmentResponse | null; loading: boolean }) {
  const readiness  = data?.overall_readiness  ?? 0;
  const vsLast     = data?.readiness_vs_last  ?? 0;
  const critical   = data?.critical_gaps_count   ?? 0;
  const high       = data?.high_priority_count   ?? 0;
  const recs       = data?.recommendations_count ?? 0;

  const isEmpty = !loading && !data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        loading={loading}
        title="Overall Readiness"
        value={isEmpty ? "—" : `${readiness}%`}
        sub={readiness >= 70 ? "Good" : readiness >= 40 ? "Moderate" : "Needs Work"}
        color={readiness >= 70 ? "text-[#10B981]" : readiness >= 40 ? "text-[#F97316]" : "text-[#EF4444]"}
        trend={vsLast > 0 ? `↑ ${vsLast}% vs last assessment` : vsLast < 0 ? `↓ ${Math.abs(vsLast)}% vs last` : undefined}
        barPct={readiness}
      />
      <StatCard
        loading={loading}
        title="Critical Gaps"
        value={isEmpty ? "—" : critical}
        sub={critical > 0 ? "Needs attention" : "All clear"}
        color={critical > 0 ? "text-[#EF4444]" : "text-[#10B981]"}
      />
      <StatCard
        loading={loading}
        title="High Priority Gaps"
        value={isEmpty ? "—" : high}
        sub={high > 0 ? "Review recommended" : "All clear"}
        color={high > 0 ? "text-[#F97316]" : "text-[#10B981]"}
      />
      <StatCard
        loading={loading}
        title="Recommendations"
        value={isEmpty ? "—" : recs}
        sub={recs > 0 ? "Actionable" : "None yet"}
        color="text-[#2563EB]"
      />
    </div>
  );
}
