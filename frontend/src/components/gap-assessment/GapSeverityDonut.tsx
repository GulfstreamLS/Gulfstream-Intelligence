import { ChevronRight } from "lucide-react";

function LegendItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-[12px] font-bold text-[#0F172A]">{value}</span>
    </div>
  );
}

export function GapSeverityDonut() {
  return (
    <div className="lg:col-span-3 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col items-center">
      <h3 className="text-[16px] font-bold text-[#1E293B] w-full mb-10">Gap Severity Distribution</h3>
      <div className="relative w-48 h-48 mb-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="#EF4444" strokeWidth="4" strokeDasharray="15, 100" strokeDashoffset="0" />
          <circle cx="18" cy="18" r="16" fill="none" stroke="#F97316" strokeWidth="4" strokeDasharray="29, 100" strokeDashoffset="-15" />
          <circle cx="18" cy="18" r="16" fill="none" stroke="#FBBF24" strokeWidth="4" strokeDasharray="33, 100" strokeDashoffset="-44" />
          <circle cx="18" cy="18" r="16" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="23, 100" strokeDashoffset="-77" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Total</span>
          <span className="text-[32px] font-bold text-[#0F172A] leading-none my-1">48</span>
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Gaps</span>
        </div>
      </div>
      <div className="w-full space-y-3.5">
        <LegendItem label="Critical" value="7 (15%)"  color="bg-[#EF4444]" />
        <LegendItem label="High"     value="14 (29%)" color="bg-[#F97316]" />
        <LegendItem label="Medium"   value="16 (33%)" color="bg-[#FBBF24]" />
        <LegendItem label="Low"      value="11 (23%)" color="bg-[#10B981]" />
      </div>
      <button className="mt-auto pt-8 text-[#2563EB] text-[13px] font-bold flex items-center gap-1 hover:underline w-full">
        View all gaps <ChevronRight size={16} />
      </button>
    </div>
  );
}
