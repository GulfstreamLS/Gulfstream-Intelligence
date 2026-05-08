
interface ProgressRowProps {
  label: string;
  val: number;
  max: number;
  color: string;
}

function ProgressRow({ label, val, max, color }: ProgressRowProps) {
  return (
    <div>
      <div className="flex justify-between text-[12px] font-bold mb-2">
        <span className="text-gs-muted">{label}</span>
        <span className="text-gs-text">{val}</span>
      </div>
      <div className="h-1.5 w-full bg-gs-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(val / max) * 100}%` }} />
      </div>
    </div>
  );
}

export function InsightsByType() {
  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-8">Insights by Type</h3>
      <div className="space-y-6">
        <ProgressRow label="Requirements"    val={312} max={400} color="bg-gs-blue" />
        <ProgressRow label="Recommendations" val={198} max={400} color="bg-gs-purple" />
        <ProgressRow label="Warnings"        val={76}  max={400} color="bg-blue-400" />
        <ProgressRow label="Best Practices"  val={56}  max={400} color="bg-gs-green" />
      </div>
    </div>
  );
}
