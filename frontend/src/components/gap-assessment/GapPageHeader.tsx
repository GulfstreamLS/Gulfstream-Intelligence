import { Plus } from "lucide-react";

export function GapPageHeader({ onNewAssessment }: { onNewAssessment: () => void }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
      <div>
        <h1 className="text-[32px] font-bold text-gs-text tracking-tight leading-tight">Global Gap Assessment</h1>
        <p className="text-gs-muted text-[15px] mt-1">Evaluate readiness for your submission across the selected region(s).</p>
        <p className="text-gs-muted text-[13px] font-medium">Identify gaps and prioritize actions for successful approvals.</p>
      </div>
      <div className="flex items-center gap-3">
        {/* <button className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-gs-border bg-gs-card text-[12px] font-bold text-gs-text hover:bg-gs-bg transition-colors">
          <Download size={15} /> Export Report
        </button> */}
        <button onClick={onNewAssessment} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={15} /> New Assessment
        </button>
      </div>
    </div>
  );
}
