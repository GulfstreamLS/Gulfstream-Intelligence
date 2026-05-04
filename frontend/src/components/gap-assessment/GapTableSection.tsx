import { ChevronRight } from "lucide-react";

interface TableRowProps {
  domain: string;
  gap: string;
  sev: string;
  sevBg: string;
  imp: string;
  status: string;
}

function TableRow({ domain, gap, sev, sevBg, imp, status }: TableRowProps) {
  return (
    <tr className="hover:bg-slate-50 transition-colors cursor-pointer group">
      <td className="px-8 py-5 text-[12px] font-bold text-[#94A3B8] uppercase tracking-widest">{domain}</td>
      <td className="px-8 py-5">
        <p className="text-[14px] font-bold text-[#475569] leading-relaxed max-w-[380px] group-hover:text-blue-600 transition-colors">{gap}</p>
      </td>
      <td className="px-8 py-5">
        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${sevBg}`}>{sev}</span>
      </td>
      <td className="px-8 py-5 text-[12px] font-bold text-[#64748B] uppercase tracking-widest">{imp}</td>
      <td className="px-8 py-5 text-[12px] font-bold text-[#2563EB] uppercase tracking-widest">{status}</td>
      <td className="px-8 py-5 text-right"><ChevronRight size={18} className="text-[#CBD5E1] inline" /></td>
    </tr>
  );
}

function ActionCard({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl hover:border-blue-300 hover:bg-white transition-all cursor-pointer group">
      <p className="text-[12px] font-bold text-[#475569] leading-snug group-hover:text-blue-600 transition-colors">{text}</p>
      <ChevronRight size={16} className="text-[#CBD5E1] shrink-0 ml-2" />
    </div>
  );
}

export function GapTableSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
      {/* Table */}
      <div className="lg:col-span-9 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-8 py-7 border-b border-[#F1F5F9]">
          <h3 className="text-[14px] font-bold text-[#1E293B] uppercase tracking-[0.1em]">Top Gaps Requiring Attention</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-[#FAFBFF] border-b border-[#F1F5F9]">
            <tr className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em]">
              <th className="px-8 py-4">Domain</th>
              <th className="px-8 py-4">Gap</th>
              <th className="px-8 py-4">Severity</th>
              <th className="px-8 py-4">Impact</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            <TableRow domain="CMC"          gap="Missing characterization data for inactive ingredients"    sev="Critical" sevBg="bg-red-50 text-[#EF4444]"    imp="High"   status="Open" />
            <TableRow domain="Non-Clinical" gap="Incomplete toxicology package for repeat-dose study"       sev="High"     sevBg="bg-orange-50 text-[#F97316]"  imp="High"   status="In Progress" />
            <TableRow domain="Clinical"     gap="Protocol lacks key inclusion/exclusion criteria"           sev="High"     sevBg="bg-orange-50 text-[#F97316]"  imp="Medium" status="Open" />
            <TableRow domain="Regulatory"   gap="Missing environmental risk assessment"                     sev="Medium"   sevBg="bg-amber-50 text-[#D97706]"    imp="Low"    status="Open" />
            <TableRow domain="Quality"      gap="Stability data not covering proposed shelf life"           sev="Medium"   sevBg="bg-amber-50 text-[#D97706]"    imp="Medium" status="Open" />
          </tbody>
        </table>
        <div className="px-8 py-5 bg-[#FDFDFD]">
          <button className="text-[#2563EB] text-[13px] font-bold flex items-center gap-1 hover:underline">
            View all gaps <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Actions + recent */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
          <h3 className="text-[13px] font-bold text-[#1E293B] uppercase tracking-[0.1em] mb-7">Recommended Actions</h3>
          <div className="space-y-4">
            <ActionCard text="Address CMC gaps for IND enabling package" />
            <ActionCard text="Complete non-clinical toxicology studies" />
            <ActionCard text="Revise clinical protocol to align with FDA expectations" />
          </div>
          <button className="mt-10 text-[#2563EB] text-[13px] font-bold flex items-center gap-1 hover:underline">
            View all recommendations <ChevronRight size={16} />
          </button>
        </div>

        <div className="bg-white p-7 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Recent Assessments</span>
            <button className="text-[#2563EB] text-[11px] font-bold">View all</button>
          </div>
          <div className="flex justify-between items-center p-4 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9] hover:border-blue-200 transition-all cursor-pointer group">
            <div>
              <p className="text-[13px] font-bold text-[#1E293B] mb-0.5 group-hover:text-blue-600 transition-colors uppercase tracking-tight">IND - Biologic Program</p>
              <p className="text-[11px] text-[#94A3B8] font-bold">May 10, 2025</p>
            </div>
            <span className="text-[18px] font-bold text-[#10B981]">72%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
