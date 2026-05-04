import { FileText, CheckCircle2, MoreHorizontal, ChevronRight } from "lucide-react";

interface DocRowData {
  name: string;
  src: string;
  type: string;
  date: string;
  insights: number;
}

const DOCUMENTS: DocRowData[] = [
  { name: "Guidance for Industry: Q8(R2) Pharmaceutical Development", src: "FDA",      type: "Regulatory Guidance", date: "May 10, 2025", insights: 24 },
  { name: "Reflection Paper on Risk-Based Quality Management",         src: "EMA",      type: "Guideline",           date: "May 8, 2025",  insights: 18 },
  { name: "Clinical Protocol - Phase 2 Study",                         src: "Internal", type: "Clinical Protocol",   date: "May 7, 2025",  insights: 32 },
  { name: "Assessment Report - Oncology IND Application",              src: "FDA",      type: "Assessment Report",   date: "May 6, 2025",  insights: 28 },
  { name: "ICH E6(R2) Good Clinical Practice",                         src: "ICH",      type: "Guideline",           date: "May 5, 2025",  insights: 16 },
];

function DocRow({ name, src, type, date, insights }: DocRowData) {
  return (
    <tr className="hover:bg-gs-bg transition-colors cursor-pointer group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <FileText className="w-[18px] h-[18px] text-red-400 shrink-0" />
          <span className="font-bold text-gs-text max-w-[280px] truncate leading-tight text-[13px]">{name}</span>
        </div>
      </td>
      <td className="px-6 py-4 font-bold text-gs-muted text-[13px]">{src}</td>
      <td className="px-6 py-4 text-gs-muted font-semibold text-[13px]">{type}</td>
      <td className="px-6 py-4 text-gs-muted font-semibold text-[13px]">{date}</td>
      <td className="px-6 py-4 text-center font-black text-gs-text text-[13px]">{insights}</td>
      <td className="px-6 py-4">
        <span className="flex items-center gap-1.5 text-gs-green font-bold text-[13px]">
          <CheckCircle2 className="w-3.5 h-3.5" /> Analyzed
        </span>
      </td>
      <td className="px-6 py-4">
        <MoreHorizontal className="w-[18px] h-[18px] text-gs-muted" />
      </td>
    </tr>
  );
}

export function RecentDocumentsTable() {
  return (
    <div className="bg-gs-card rounded-2xl border border-gs-border shadow-card overflow-hidden">
      <div className="p-6 flex justify-between items-center border-b border-gs-border">
        <h3 className="text-[16px] font-bold text-gs-text">Recent Documents</h3>
      </div>

      {/* Horizontal scroll on small screens */}
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gs-bg text-[11px] font-bold text-gs-muted uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Document Name</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Upload Date</th>
              <th className="px-6 py-4 text-center">Key Insights</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gs-border">
            {DOCUMENTS.map((doc) => (
              <DocRow key={doc.name} {...doc} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gs-border">
        <button className="text-gs-blue text-[13px] font-bold flex items-center gap-1 hover:underline">
          View all documents <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
