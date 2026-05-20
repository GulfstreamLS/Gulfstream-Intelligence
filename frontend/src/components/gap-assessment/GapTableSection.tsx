import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { GapSummary } from "../../types";

const SEV_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-50 dark:bg-red-950/40 text-red-500",
  HIGH:     "bg-orange-50 dark:bg-orange-950/40 text-orange-500",
  MEDIUM:   "bg-amber-50 dark:bg-amber-950/40 text-amber-600",
  LOW:      "bg-blue-50 dark:bg-blue-950/40 text-blue-600",
};

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-black text-gs-muted uppercase tracking-[0.14em] mb-1">{label}</p>
      <p className="text-[12px] font-semibold text-gs-text leading-relaxed">{value || "Not specified"}</p>
    </div>
  );
}

function TableRow(gap: GapSummary) {
  const [open, setOpen] = useState(false);
  const { domain, title, severity, impact, status } = gap;
  return (
    <>
      <tr className="hover:bg-gs-bg transition-colors cursor-pointer group" onClick={() => setOpen(v => !v)}>
        <td className="px-8 py-5 text-[12px] font-bold text-gs-muted uppercase tracking-widest">{domain}</td>
        <td className="px-8 py-5">
          <p className="text-[14px] font-bold text-gs-text leading-relaxed max-w-[380px] group-hover:text-blue-600 transition-colors">{title}</p>
        </td>
        <td className="px-8 py-5">
          <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${SEV_STYLES[severity] ?? SEV_STYLES.LOW}`}>
            {severity}
          </span>
        </td>
        <td className="px-8 py-5 text-[12px] font-bold text-gs-muted uppercase tracking-widest">{impact}</td>
        <td className="px-8 py-5 text-[12px] font-bold text-blue-600 uppercase tracking-widest">{status}</td>
        <td className="px-8 py-5 text-right">
          {open ? <ChevronDown size={18} className="text-blue-600 inline" /> : <ChevronRight size={18} className="text-gs-muted inline" />}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="px-8 py-6 bg-gs-bg border-t border-gs-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
              <DetailItem label="Why this matters" value={gap.why_this_matters} />
              <DetailItem label="Health authority relevance" value={gap.health_authority_relevance} />
              <DetailItem label="Source / evidence" value={gap.source_evidence} />
              <DetailItem label="Supporting document reference" value={gap.document_reference} />
              <DetailItem label="Recommended action" value={gap.recommended_action} />
              <DetailItem label="Suggested owner" value={gap.suggested_owner} />
              <DetailItem label="Target date" value={gap.target_date} />
              <DetailItem label="Priority level" value={gap.priority_level || severity} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-8 py-5"><div className="h-3 bg-gs-border rounded w-full" /></td>
      ))}
    </tr>
  );
}

export function GapTableSection({ data, loading }: { data: GapSummary[]; loading: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
      {/* Table */}
      <div className="lg:col-span-9 bg-gs-card rounded-xl border border-gs-border shadow-sm overflow-hidden">
        <div className="px-8 py-7 border-b border-gs-border">
          <h3 className="text-[14px] font-bold text-gs-text uppercase tracking-[0.1em]">Top Gaps Requiring Attention</h3>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gs-bg border-b border-gs-border">
            <tr className="text-[11px] font-bold text-gs-muted uppercase tracking-[0.15em]">
              <th className="px-8 py-4">Domain</th>
              <th className="px-8 py-4">Gap</th>
              <th className="px-8 py-4">Severity</th>
              <th className="px-8 py-4">Impact</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gs-border">
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-14 text-center">
                  <p className="text-[13px] font-bold text-gs-muted">No gaps found.</p>
                  <p className="text-[11px] text-gs-muted mt-1">Run a document analysis in Chat to populate this table.</p>
                </td>
              </tr>
            ) : (
              data.map(gap => <TableRow key={gap.id} {...gap} />)
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Side panel */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-gs-card p-8 rounded-xl border border-gs-border shadow-sm">
          <h3 className="text-[13px] font-bold text-gs-text uppercase tracking-[0.1em] mb-7">Severity Summary</h3>
          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gs-border rounded-xl animate-pulse" />
              ))
            ) : data.length === 0 ? (
              <p className="text-[12px] text-gs-muted font-bold">No gaps to summarise.</p>
            ) : (
              data.slice(0, 3).map(gap => (
                <div key={gap.id} className="flex items-center justify-between p-4 bg-gs-bg border border-gs-border rounded-xl hover:border-blue-400 hover:bg-gs-card transition-all cursor-pointer group">
                  <p className="text-[12px] font-bold text-gs-text leading-snug group-hover:text-blue-600 truncate">{gap.title}</p>
                  <span className={`ml-2 shrink-0 text-[10px] font-black px-2 py-0.5 rounded ${SEV_STYLES[gap.severity] ?? SEV_STYLES.LOW}`}>{gap.severity}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
