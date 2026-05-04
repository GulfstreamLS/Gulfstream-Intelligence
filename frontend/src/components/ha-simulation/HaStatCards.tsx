import { HelpCircle, AlertTriangle, ShieldCheck, BarChart2 } from "lucide-react";

function StatCard({ title, value, subtext, icon: Icon, color, isDonut }: {
  title: string; value: string; subtext: string;
  icon?: React.ElementType; color?: string; isDonut?: boolean;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-500 text-sm font-medium">{title}</span>
        {Icon && !isDonut && <div className={`p-2 rounded-lg ${color}`}><Icon size={18} /></div>}
        {isDonut && (
          <div className="relative w-10 h-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="100" strokeDashoffset="29" className="text-emerald-500" />
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

export function HaStatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <StatCard title="Total Questions"   value="18"   subtext="Generated"      icon={HelpCircle}   color="bg-indigo-50 text-indigo-600" />
      <StatCard title="Critical Questions" value="7"   subtext="39% of total"   icon={AlertTriangle} color="bg-red-50 text-red-600" />
      <StatCard title="Key Concerns"      value="5"    subtext="Identified"     icon={ShieldCheck}   color="bg-orange-50 text-orange-600" />
      <StatCard title="Readiness Score"   value="71%"  subtext="Good"           isDonut />
      <StatCard title="Confidence Level"  value="High" subtext="Based on inputs" icon={BarChart2}    color="bg-violet-50 text-violet-600" />
    </div>
  );
}
