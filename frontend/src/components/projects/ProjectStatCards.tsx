import { Beaker, ShieldCheck, Activity, FlaskConical, ChevronRight } from "lucide-react";

function StatCard({ title, count, trend, icon: Icon, color, iconBg }: {
  title: string; count: string; trend?: string;
  icon: React.ElementType; color: string; iconBg: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px]">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${iconBg} ${color}`}><Icon size={24} /></div>
        <div className="text-right">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</span>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">{count}</h3>
        </div>
      </div>
      <div className="mt-4">
        {trend ? (
          <span className="text-emerald-500 text-[11px] font-bold flex items-center gap-1">
            <ChevronRight size={12} className="-rotate-90" /> {trend}
          </span>
        ) : (
          <span className="text-slate-400 text-[11px] font-bold">No change</span>
        )}
      </div>
    </div>
  );
}

export function ProjectStatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <StatCard title="Total Projects" count="15" trend="3 this month" icon={Beaker}      color="text-blue-600"    iconBg="bg-blue-50" />
      <StatCard title="On Track"       count="8"  trend="1 this month" icon={ShieldCheck} color="text-emerald-600" iconBg="bg-emerald-50" />
      <StatCard title="At Risk"        count="4"  trend="1 this month" icon={Activity}    color="text-orange-600" iconBg="bg-orange-50" />
      <StatCard title="Planning"       count="3"               icon={FlaskConical} color="text-purple-600" iconBg="bg-purple-50" />
    </div>
  );
}
