import { AlertCircle, CheckCircle2, ClipboardCheck, FlaskConical, ChevronRight } from "lucide-react";

function NextStep({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl hover:border-blue-200 transition-all cursor-pointer group">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-[12px] font-black text-[#1E293B] uppercase tracking-tight mb-1 group-hover:text-blue-600">{title}</p>
        <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-tighter leading-tight">{sub}</p>
      </div>
      <ChevronRight size={16} className="text-[#CBD5E1] mt-2" />
    </div>
  );
}

export function GapNextSteps() {
  return (
    <div className="lg:col-span-3 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
      <h3 className="text-[16px] font-bold text-[#1E293B] mb-8">Next Steps</h3>
      <div className="space-y-4">
        <NextStep icon={<AlertCircle className="text-[#EF4444]" />}   title="7 critical gaps"          sub="Require immediate attention" />
        <NextStep icon={<ClipboardCheck className="text-[#F97316]" />} title="CMC gaps are the top"     sub="risk to IND readiness" />
        <NextStep icon={<FlaskConical className="text-[#FBBF24]" />}   title="Non-clinical data gaps"   sub="impact safety package" />
        <NextStep icon={<CheckCircle2 className="text-[#10B981]" />}   title="15 recommendations"       sub="available to improve overall readiness" />
      </div>
      <button className="mt-10 text-[#2563EB] text-[13px] font-bold flex items-center gap-1 hover:underline">
        View all insights <ChevronRight size={16} />
      </button>
    </div>
  );
}
