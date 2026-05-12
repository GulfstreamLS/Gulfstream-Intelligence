import { Beaker, ShieldCheck, Activity, FlaskConical, ChevronRight } from "lucide-react";

function StatCard({ title, count, trend, icon: Icon, color, iconBg }: {
  title: string; count: string; trend?: string;
  icon: React.ElementType; color: string; iconBg: string;
}) {
  return (
    <div className="bg-gs-card p-6 rounded-xl border border-gs-border shadow-sm flex flex-col justify-between min-h-[140px]">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${iconBg} ${color}`}><Icon size={24} /></div>
        <div className="text-right">
          <span className="text-gs-muted text-xs font-bold uppercase tracking-wider">{title}</span>
          <h3 className="text-3xl font-bold text-gs-text mt-1">{count}</h3>
        </div>
      </div>
      <div className="mt-4">
        {trend ? (
          <span className="text-emerald-500 text-[11px] font-bold flex items-center gap-1">
            <ChevronRight size={12} className="-rotate-90" /> {trend}
          </span>
        ) : (
          <span className="text-gs-muted text-[11px] font-bold">No change</span>
        )}
      </div>
    </div>
  );
}

export function ProjectStatCards({ total, onTrack, atRisk, planning }: {
  total: number; onTrack: number; atRisk: number; planning: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <StatCard title="Total Projects" count={String(total)}    icon={Beaker}       color="text-blue-600 dark:text-blue-400"    iconBg="bg-blue-50 dark:bg-blue-900/30" />
      <StatCard title="On Track"       count={String(onTrack)}  icon={ShieldCheck}  color="text-emerald-600 dark:text-emerald-400" iconBg="bg-emerald-50 dark:bg-emerald-900/30" />
      <StatCard title="At Risk"        count={String(atRisk)}   icon={Activity}     color="text-orange-600 dark:text-orange-400" iconBg="bg-orange-50 dark:bg-orange-900/30" />
      <StatCard title="Planning"       count={String(planning)} icon={FlaskConical} color="text-purple-600 dark:text-purple-400" iconBg="bg-purple-50 dark:bg-purple-900/30" />
    </div>
  );
}
