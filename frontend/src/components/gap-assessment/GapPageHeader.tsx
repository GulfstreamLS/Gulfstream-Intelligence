import { Download, Plus } from "lucide-react";

export function GapPageHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
      <div>
        <h1 className="text-[32px] font-bold text-[#0F172A] tracking-tight leading-tight">Global Gap Assessment</h1>
        <p className="text-[#64748B] text-[15px] mt-1">Evaluate readiness for your submission across the selected region(s).</p>
        <p className="text-[#94A3B8] text-[13px] font-medium">Identify gaps and prioritize actions for successful approvals.</p>
      </div>
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] rounded-lg text-[14px] font-bold shadow-sm hover:bg-slate-50 transition-all">
          <Download size={18} className="text-[#2563EB]" /> Export Report
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-[14px] font-bold hover:bg-[#1D4ED8] shadow-lg shadow-blue-100 transition-all">
          <Plus size={18} /> New Assessment
        </button>
      </div>
    </div>
  );
}
