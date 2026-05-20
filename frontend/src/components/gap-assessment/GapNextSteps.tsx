import { AlertCircle, CheckCircle2, ClipboardCheck, FlaskConical, ChevronRight } from "lucide-react";
import type { GapActionItem } from "../../types";

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  High:     <AlertCircle className="text-red-500" />,
  Medium:   <ClipboardCheck className="text-orange-500" />,
  Low:      <FlaskConical className="text-yellow-400" />,
  Critical: <AlertCircle className="text-red-500" />,
};

function NextStep({ title, description, priority }: GapActionItem) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gs-bg border border-gs-border rounded-xl hover:border-blue-400 transition-all cursor-pointer group">
      <div className="mt-0.5 shrink-0">{PRIORITY_ICONS[priority] ?? <CheckCircle2 className="text-emerald-500" />}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black text-gs-text uppercase tracking-tight mb-1 group-hover:text-blue-600 truncate">{title}</p>
        <p className="text-[11px] font-bold text-gs-muted uppercase tracking-tighter leading-tight line-clamp-2">{description}</p>
      </div>
      <ChevronRight size={16} className="text-gs-muted mt-2 shrink-0" />
    </div>
  );
}

function SkeletonStep() {
  return (
    <div className="flex items-start gap-4 p-4 bg-gs-bg border border-gs-border rounded-xl animate-pulse">
      <div className="w-5 h-5 rounded-full bg-gs-border mt-0.5 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gs-border rounded w-3/4" />
        <div className="h-2 bg-gs-border rounded w-full" />
      </div>
    </div>
  );
}

export function GapNextSteps({ data, loading }: { data: GapActionItem[]; loading: boolean }) {
  return (
    <div className="lg:col-span-3 bg-gs-card p-4 rounded-xl border border-gs-border shadow-sm">
      <h3 className="text-[16px] font-bold text-gs-text mb-8">Next Steps</h3>
      <div className="space-y-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonStep key={i} />)
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 size={28} className="text-gs-muted mb-3" />
            <p className="text-[13px] font-bold text-gs-muted">No actions yet.</p>
            <p className="text-[11px] text-gs-muted mt-1">Run a document analysis in Chat to generate recommendations.</p>
          </div>
        ) : (
          data.map((step, i) => <NextStep key={i} {...step} />)
        )}
      </div>
    </div>
  );
}
