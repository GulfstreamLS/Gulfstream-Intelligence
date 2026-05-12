"use client";

import { FileText, CheckCircle2 } from "lucide-react";
import type { AnalyzedDocument } from "../../types";

interface Props {
  documents: AnalyzedDocument[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DocRow({ doc }: { doc: AnalyzedDocument }) {
  const ext = doc.filename.split(".").pop()?.toUpperCase() ?? "FILE";
  return (
    <tr className="hover:bg-gs-bg transition-colors">
      <td className="px-6 py-4 w-[300px] whitespace-nowrap">
        <div className="flex items-center gap-3">
          <FileText className="w-[18px] h-[18px] text-red-400 shrink-0" />
          <span className="font-bold text-gs-text max-w-[220px] truncate leading-tight text-[13px]">{doc.filename}</span>
        </div>
      </td>
      <td className="px-6 py-4 font-bold text-gs-muted text-[13px] whitespace-nowrap">{doc.authority ?? "—"}</td>
      <td className="px-6 py-4 text-gs-muted font-semibold text-[13px] whitespace-nowrap">{ext} Document</td>
      <td className="px-6 py-4 text-gs-muted font-semibold text-[13px] whitespace-nowrap">{formatDate(doc.created_at)}</td>
      <td className="px-6 py-4 text-center font-black text-gs-text text-[13px] whitespace-nowrap">{doc.gap_count}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="flex items-center gap-1.5 text-gs-green font-bold text-[13px]">
          <CheckCircle2 className="w-3.5 h-3.5" /> Analyzed
        </span>
      </td>
    </tr>
  );
}

export function RecentDocumentsTable({ documents }: Props) {
  const sorted = [...documents].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="bg-gs-card rounded-2xl border border-gs-border shadow-card overflow-hidden flex flex-col h-full">
      <div className="p-6 flex justify-between items-center border-b border-gs-border shrink-0">
        <h3 className="text-[16px] font-bold text-gs-text">Recent Documents</h3>
        {sorted.length > 0 && (
          <span className="text-[11px] font-bold text-gs-muted">{sorted.length} total</span>
        )}
      </div>

      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
        <table className="w-full text-left min-w-[640px]">
          <thead className="bg-gs-bg text-[11px] font-bold text-gs-muted uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 whitespace-nowrap">Document Name</th>
              <th className="px-6 py-3 whitespace-nowrap">Source</th>
              <th className="px-6 py-3 whitespace-nowrap">Type</th>
              <th className="px-6 py-3 whitespace-nowrap">Upload Date</th>
              <th className="px-6 py-3 text-center whitespace-nowrap">Gaps Found</th>
              <th className="px-6 py-3 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gs-border">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[13px] text-gs-muted font-medium">
                  No documents analyzed yet. Upload a file in Regulatory Chat to get started.
                </td>
              </tr>
            ) : (
              sorted.map((doc) => <DocRow key={doc.id} doc={doc} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
