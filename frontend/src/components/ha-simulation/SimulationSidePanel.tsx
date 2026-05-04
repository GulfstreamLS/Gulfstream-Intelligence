function TopicRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs font-semibold mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-400">{count}</span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${(count / 7) * 100}%` }} />
      </div>
    </div>
  );
}

export function SimulationSidePanel() {
  return (
    <div className="lg:col-span-4 space-y-6">
      {/* Donut summary */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Simulation Summary</h3>
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 mb-6">
            <svg viewBox="0 0 40 40" className="w-full h-full transform -rotate-90">
              <circle cx="20" cy="20" r="15" fill="transparent" stroke="#E2E8F0" strokeWidth="6" />
              <circle cx="20" cy="20" r="15" fill="transparent" stroke="#EF4444" strokeWidth="6" strokeDasharray="94.2" strokeDashoffset="37" />
              <circle cx="20" cy="20" r="15" fill="transparent" stroke="#F97316" strokeWidth="6" strokeDasharray="94.2" strokeDashoffset="65" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">18</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Questions</span>
            </div>
          </div>
          <div className="w-full space-y-3">
            {[
              { label: "Critical (39%)", color: "bg-red-500",    count: 7 },
              { label: "High (33%)",     color: "bg-orange-500", count: 6 },
              { label: "Medium (17%)",   color: "bg-yellow-400", count: 3 },
              { label: "Low (11%)",      color: "bg-emerald-500", count: 2 },
            ].map(({ label, color, count }) => (
              <div key={label} className="flex justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-600">
                  <div className={`w-2 h-2 rounded-full ${color}`} /> {label}
                </div>
                <span className="font-bold text-slate-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top topics */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Top Topics</h3>
        <TopicRow label="CMC & Manufacturing"  count={7} color="bg-red-500" />
        <TopicRow label="Nonclinical"           count={5} color="bg-orange-500" />
        <TopicRow label="Clinical Plan"         count={3} color="bg-yellow-400" />
        <TopicRow label="Quality Systems"       count={2} color="bg-emerald-500" />
        <TopicRow label="Regulatory Strategy"   count={1} color="bg-indigo-500" />
        <button className="w-full pt-4 mt-2 text-xs font-bold text-indigo-600 border-t border-slate-100">
          View all topics →
        </button>
      </div>
    </div>
  );
}
