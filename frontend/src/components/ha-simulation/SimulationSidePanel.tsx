import type { SimulationSession } from "../../types";

const SEV_COLORS: Record<string, string> = {
  Critical: "#EF4444",
  High:     "#F97316",
  Medium:   "#FBBF24",
  Low:      "#10B981",
};
const SEV_BG: Record<string, string> = {
  Critical: "bg-red-500",
  High:     "bg-orange-500",
  Medium:   "bg-yellow-400",
  Low:      "bg-emerald-500",
};

function TopicRow({ label, count, max }: { label: string; count: number; max: number }) {
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-emerald-500", "bg-indigo-500"];
  const idx    = ["CMC & Manufacturing","Nonclinical","Clinical Plan","Quality Systems","Regulatory Strategy"].indexOf(label);
  const color  = colors[idx] ?? "bg-indigo-500";
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs font-semibold mb-1.5">
        <span className="text-slate-600 truncate pr-2">{label}</span>
        <span className="text-slate-400 shrink-0">{count}</span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: max > 0 ? `${(count / max) * 100}%` : "0%" }} />
      </div>
    </div>
  );
}

export function SimulationSidePanel({ session, loading }: { session: SimulationSession | null; loading: boolean }) {
  const questions = session?.questions ?? [];
  const total     = questions.length;

  // Severity distribution
  const sevCounts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  for (const q of questions) { sevCounts[q.severity] = (sevCounts[q.severity] ?? 0) + 1; }

  // Topic distribution
  const topicCounts: Record<string, number> = {};
  for (const q of questions) { topicCounts[q.topic] = (topicCounts[q.topic] ?? 0) + 1; }
  const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxTopic  = topTopics[0]?.[1] ?? 1;

  // SVG donut segments
  const circumference = 94.2;
  let offset = 0;
  const segments = (["Critical","High","Medium","Low"] as const)
    .filter(s => sevCounts[s] > 0)
    .map(s => {
      const pct  = total > 0 ? sevCounts[s] / total : 0;
      const dash = pct * circumference;
      const seg  = { label: s, count: sevCounts[s], pct: Math.round(pct * 100), dash, offset };
      offset += dash;
      return seg;
    });

  if (loading) {
    return (
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm animate-pulse">
          <div className="h-4 w-36 bg-slate-200 rounded mb-6" />
          <div className="w-40 h-40 rounded-full bg-slate-100 mx-auto mb-6" />
          {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-slate-100 rounded mb-3" />)}
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm animate-pulse">
          <div className="h-4 w-24 bg-slate-200 rounded mb-6" />
          {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-slate-100 rounded mb-4" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-4 space-y-6">
      {/* Donut */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Simulation Summary</h3>
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 mb-6">
            {total === 0 ? (
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <circle cx="20" cy="20" r="15" fill="transparent" stroke="#E2E8F0" strokeWidth="6" />
              </svg>
            ) : (
              <svg viewBox="0 0 40 40" className="w-full h-full transform -rotate-90">
                <circle cx="20" cy="20" r="15" fill="transparent" stroke="#E2E8F0" strokeWidth="6" />
                {segments.map(seg => (
                  <circle
                    key={seg.label}
                    cx="20" cy="20" r="15"
                    fill="transparent"
                    stroke={SEV_COLORS[seg.label]}
                    strokeWidth="6"
                    strokeDasharray={`${seg.dash} ${circumference}`}
                    strokeDashoffset={-seg.offset}
                  />
                ))}
              </svg>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">{total}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Questions</span>
            </div>
          </div>
          <div className="w-full space-y-3">
            {(["Critical","High","Medium","Low"] as const).map(s => (
              <div key={s} className="flex justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-600">
                  <div className={`w-2 h-2 rounded-full ${SEV_BG[s]}`} />
                  {s} ({total > 0 ? Math.round(sevCounts[s] / total * 100) : 0}%)
                </div>
                <span className="font-bold text-slate-400">{sevCounts[s]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Top Topics</h3>
        {topTopics.length === 0 ? (
          <p className="text-xs text-slate-400 font-bold text-center py-4">No data yet.</p>
        ) : (
          topTopics.map(([label, count]) => (
            <TopicRow key={label} label={label} count={count} max={maxTopic} />
          ))
        )}
      </div>
    </div>
  );
}
