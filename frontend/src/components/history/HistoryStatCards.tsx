import { FileText, MessageSquare, PlayCircle, UploadCloud, ChevronRight } from "lucide-react";

interface Props {
  totalActivities: number;
  docsProcessed: number;
  simulationsRun: number;
  filesUploaded: number;
}

function StatCard({ title, value, trend, icon: Icon, color }: {
  title: string; value: string; trend: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-gs-card p-5 rounded-xl border border-gs-border shadow-sm flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon size={24} />
      </div>
      <div className="flex flex-col">
        <span className="text-gs-muted text-xs font-bold uppercase tracking-wider">{title}</span>
        <h3 className="text-2xl font-bold text-gs-text mt-1">{value}</h3>
        <span className="text-gs-muted text-[11px] font-bold flex items-center gap-1 mt-0.5">
          <ChevronRight size={12} className="-rotate-90" /> {trend}
        </span>
      </div>
    </div>
  );
}

export function HistoryStatCards({ totalActivities, docsProcessed, simulationsRun, filesUploaded }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard title="Total Activities"    value={String(totalActivities)} trend="All time"  icon={FileText}     color="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
      <StatCard title="Documents Processed" value={String(docsProcessed)}  trend="Analyzed"  icon={MessageSquare} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
      <StatCard title="Simulations Run"     value={String(simulationsRun)} trend="All time"  icon={PlayCircle}   color="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
      <StatCard title="Files Uploaded"      value={String(filesUploaded)}  trend="All time"  icon={UploadCloud}  color="bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" />
    </div>
  );
}
