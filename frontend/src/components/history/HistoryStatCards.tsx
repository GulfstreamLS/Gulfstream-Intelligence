import { FileText, MessageSquare, PlayCircle, UploadCloud, ChevronRight } from "lucide-react";

function StatCard({ title, value, trend, icon: Icon, color }: {
  title: string; value: string; trend: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon size={24} />
      </div>
      <div className="flex flex-col">
        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</span>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        <span className="text-emerald-500 text-[11px] font-bold flex items-center gap-1 mt-0.5">
          <ChevronRight size={12} className="-rotate-90" /> {trend}
        </span>
      </div>
    </div>
  );
}

export function HistoryStatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard title="Total Activities"      value="1,248" trend="18% vs last 30 days" icon={FileText}    color="bg-blue-50 text-blue-600" />
      <StatCard title="Documents Processed"   value="342"   trend="12% vs last 30 days" icon={MessageSquare} color="bg-emerald-50 text-emerald-600" />
      <StatCard title="Simulations Run"       value="24"    trend="9% vs last 30 days"  icon={PlayCircle}  color="bg-purple-50 text-purple-600" />
      <StatCard title="Files Uploaded"        value="186"   trend="15% vs last 30 days" icon={UploadCloud} color="bg-orange-50 text-orange-600" />
    </div>
  );
}
