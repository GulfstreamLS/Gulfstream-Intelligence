import { HelpCircle, AlertTriangle, ShieldCheck, BarChart2 } from "lucide-react";
import type { SimulationSession } from "../../types";

function StatCard({ title, value, subtext, icon: Icon, color, isDonut, loading }: {
  title: string; value: string; subtext: string;
  icon?: React.ElementType; color?: string; isDonut?: boolean; loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm animate-pulse">
        <div className="h-3 w-28 bg-slate-200 rounded mb-4" />
        <div className="h-7 w-16 bg-slate-200 rounded mb-2" />
        <div className="h-2 w-20 bg-slate-100 rounded" />
      </div>
    );
  }
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-500 text-sm font-medium">{title}</span>
        {Icon && !isDonut && <div className={`p-2 rounded-lg ${color}`}><Icon size={18} /></div>}
        {isDonut && (
          <div className="relative w-10 h-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent"
                strokeDasharray="100"
                strokeDashoffset={String(100 - parseFloat(value))}
                className="text-emerald-500"
              />
            </svg>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        <p className={`text-xs font-medium mt-1 ${title.includes("Readiness") ? "text-emerald-600" : "text-slate-400"}`}>
          {subtext}
        </p>
      </div>
    </div>
  );
}

export function HaStatCards({ session, loading }: { session: SimulationSession | null; loading: boolean }) {
  const total    = session?.total_questions   ?? 0;
  const critical = session?.critical_count    ?? 0;
  const concerns = session?.key_concerns_count ?? 0;
  const score    = session?.readiness_score   ?? 0;
  const conf     = session?.confidence_level  ?? "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <StatCard loading={loading} title="Total Questions"    value={loading ? "—" : String(total)}    subtext="Generated"        icon={HelpCircle}    color="bg-indigo-50 text-indigo-600" />
      <StatCard loading={loading} title="Critical Questions" value={loading ? "—" : String(critical)} subtext={`${total ? Math.round(critical / total * 100) : 0}% of total`} icon={AlertTriangle} color="bg-red-50 text-red-600" />
      <StatCard loading={loading} title="Key Concerns"       value={loading ? "—" : String(concerns)} subtext="Identified"        icon={ShieldCheck}   color="bg-orange-50 text-orange-600" />
      <StatCard loading={loading} title="Readiness Score"    value={loading ? "—" : `${Math.round(score)}%`} subtext={score >= 70 ? "Good" : score >= 40 ? "Moderate" : "Needs Work"} isDonut />
      <StatCard loading={loading} title="Confidence Level"   value={loading ? "—" : conf}             subtext="Based on inputs"   icon={BarChart2}     color="bg-violet-50 text-violet-600" />
    </div>
  );
}
