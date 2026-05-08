import { ShieldCheck, HelpCircle, CheckCircle, ChevronRight } from "lucide-react";
import type { SimulationSession } from "../../types";

const SEV_STYLES: Record<string, string> = {
  Critical: "bg-red-50 text-red-600",
  High:     "bg-orange-50 text-orange-600",
  Medium:   "bg-yellow-50 text-yellow-600",
  Low:      "bg-emerald-50 text-emerald-600",
};

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded-lg" />)}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-slate-300 font-bold text-center py-6">{text}</p>;
}

export function HaBottomCards({ session, loading }: { session: SimulationSession | null; loading: boolean }) {
  const concerns  = session?.concerns  ?? [];
  const followups = session?.followups ?? [];
  const actions   = session?.actions   ?? [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Key Concerns */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck size={20} className="text-red-500" />
          <h3 className="font-bold text-slate-800">Key Concerns Identified</h3>
        </div>
        {loading ? <Skeleton /> : concerns.length === 0 ? <Empty text="No concerns yet." /> : (
          <div className="space-y-4">
            {concerns.map(c => (
              <div key={c.id} className="flex justify-between items-center gap-3">
                <p className="text-xs font-semibold text-slate-600">{c.text}</p>
                <span className={`${SEV_STYLES[c.severity] ?? SEV_STYLES.Low} text-[8px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap`}>
                  {c.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Follow-up Questions */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle size={20} className="text-indigo-500" />
          <h3 className="font-bold text-slate-800">Likely Follow-up Questions</h3>
        </div>
        {loading ? <Skeleton /> : followups.length === 0 ? <Empty text="No follow-ups yet." /> : (
          <div className="space-y-4">
            {followups.map(f => (
              <div key={f.id} className="flex justify-between items-center group cursor-pointer">
                <p className="text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">{f.text}</p>
                <ChevronRight size={14} className="text-slate-300 shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Actions */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle size={20} className="text-emerald-500" />
          <h3 className="font-bold text-slate-800">Recommended Actions</h3>
        </div>
        {loading ? <Skeleton /> : actions.length === 0 ? <Empty text="No actions yet." /> : (
          <div className="space-y-4">
            {actions.map(a => (
              <div key={a.id} className="flex justify-between items-center group cursor-pointer">
                <p className="text-xs font-semibold text-slate-600 group-hover:text-emerald-600 transition-colors">{a.text}</p>
                <ChevronRight size={14} className="text-slate-300 shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
