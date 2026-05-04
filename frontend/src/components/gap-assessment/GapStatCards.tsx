import { ChevronRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  color: string;
  trend?: string;
  showBar?: boolean;
}

function StatCard({ title, value, sub, color, trend, showBar }: StatCardProps) {
  return (
    <div className="bg-white p-7 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col h-full">
      <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] mb-4">{title}</span>
      <div className="flex items-baseline gap-3 mb-1">
        <h4 className="text-[30px] font-bold text-[#0F172A] leading-none tracking-tight">{value}</h4>
        <span className={`text-[12px] font-bold ${color}`}>{sub}</span>
      </div>
      {showBar && (
        <div className="w-full bg-[#F1F5F9] h-[5px] rounded-full mt-3 overflow-hidden">
          <div className="bg-[#10B981] h-full" style={{ width: "72%" }} />
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

export function GapStatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard title="Overall Readiness"    value="72%" sub="Good"               color="text-[#10B981]" trend="↑ 8% vs last assessment" showBar />
      <StatCard title="Critical Gaps"        value="7"   sub="Needs attention"    color="text-[#EF4444]" />
      <StatCard title="High Priority Gaps"   value="14"  sub="Review recommended" color="text-[#F97316]" />
      <StatCard title="Recommendations"      value="28"  sub="Actionable"         color="text-[#2563EB]" />
    </div>
  );
}
