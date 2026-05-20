import { useState } from "react";
import type React from "react";
import { Calendar, ChevronDown, ChevronRight, ClipboardList, FileText, Folder, Globe2, Settings2, ShieldCheck } from "lucide-react";
import type { AssessmentDocumentSummary } from "../../types";

export type AssessmentBasis = {
  assessmentType: string;
  sourceType: string;
  projectName?: string;
  documentsReviewed: AssessmentDocumentSummary[];
  regions: string[];
  lastRun: string;
  confidence: string;
};

function BasisItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gs-muted">{label}</p>
        <p className="text-[12px] font-black text-gs-text truncate">{value}</p>
      </div>
    </div>
  );
}

export function AssessmentBasisPanel({ basis, onSettings }: { basis: AssessmentBasis; onSettings: () => void }) {
  const [open, setOpen] = useState(false);
  const docs = basis.documentsReviewed.length
    ? basis.documentsReviewed.map(doc => doc.filename).slice(0, 3).join(", ")
    : "No analyzed documents";

  return (
    <div className="bg-gs-card border border-gs-border rounded-xl shadow-sm mb-6 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gs-border">
        <h2 className="text-[13px] font-black text-gs-text uppercase tracking-[0.1em]">Assessment Basis</h2>
        <button onClick={() => setOpen(v => !v)} className="flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:underline">
          Details {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-5 px-6 py-5">
        <BasisItem icon={<ShieldCheck size={16} />} label="Source" value={basis.sourceType} />
        <BasisItem icon={<Folder size={16} />} label="Project" value={basis.projectName || "Session-based"} />
        <BasisItem icon={<ClipboardList size={16} />} label="Assessment Type" value={basis.assessmentType} />
        <BasisItem icon={<FileText size={16} />} label="Documents Reviewed" value={docs} />
        <BasisItem icon={<Globe2 size={16} />} label="Regions" value={basis.regions.join(", ") || "Global"} />
        <BasisItem icon={<span className="w-2.5 h-2.5 rounded-full bg-orange-400" />} label="Confidence" value={basis.confidence} />
        <BasisItem icon={<Calendar size={16} />} label="Last Run" value={basis.lastRun} />
      </div>
      {open && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-6 py-5 bg-gs-bg border-t border-gs-border">
          <div>
            <p className="text-[10px] font-black text-gs-muted uppercase tracking-[0.14em] mb-2">Assessment Type</p>
            <p className="text-sm font-bold text-gs-text">{basis.assessmentType}</p>
            <p className="text-[10px] font-black text-gs-muted uppercase tracking-[0.14em] mt-5 mb-2">Source</p>
            <p className="text-sm font-bold text-gs-text">{basis.sourceType}</p>
            {basis.projectName && (
              <>
                <p className="text-[10px] font-black text-gs-muted uppercase tracking-[0.14em] mt-5 mb-2">Project</p>
                <p className="text-sm font-bold text-blue-600">{basis.projectName}</p>
              </>
            )}
          </div>
          <div className="lg:col-span-2">
            <p className="text-[10px] font-black text-gs-muted uppercase tracking-[0.14em] mb-3">Documents Reviewed ({basis.documentsReviewed.length})</p>
            <div className="space-y-2">
              {basis.documentsReviewed.slice(0, 6).map(doc => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gs-border bg-gs-card px-3 py-2">
                  <span className="text-xs font-bold text-gs-text truncate">{doc.filename}</span>
                  <span className="text-[10px] font-black uppercase text-gs-muted">{doc.source || doc.file_type || "Document"}</span>
                </div>
              ))}
              {basis.documentsReviewed.length === 0 && <p className="text-xs font-semibold text-gs-muted">No documents were available for this assessment.</p>}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-gs-muted uppercase tracking-[0.14em] mb-2">Regions / Health Authorities</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {(basis.regions.length ? basis.regions : ["Global"]).map(region => (
                <span key={region} className="px-2.5 py-1 rounded-lg border border-gs-border bg-gs-card text-xs font-bold text-gs-text">{region}</span>
              ))}
            </div>
            <p className="text-[10px] font-black text-gs-muted uppercase tracking-[0.14em] mb-2">Last Run</p>
            <p className="text-sm font-bold text-gs-text mb-5">{basis.lastRun}</p>
            <button onClick={onSettings} className="inline-flex items-center gap-2 text-[12px] font-bold text-blue-600 hover:underline">
              <Settings2 size={14} /> View Assessment Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
