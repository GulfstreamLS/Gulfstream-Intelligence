import {
  Download, Search, Calendar, ChevronDown, Filter, ShieldCheck
} from "lucide-react";
import { HistoryStatCards } from "../../../../components/history/HistoryStatCards";
import { ActivityTable }    from "../../../../components/history/ActivityTable";

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">History</h1>
            <p className="text-slate-500 text-sm mt-1">View and track all recent activity across the platform.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-bold bg-white hover:bg-blue-50 transition-colors shadow-sm self-start md:self-center">
            <Download size={16} /> Export History
          </button>
        </div>

        <HistoryStatCards />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by activity, document name, project, or user..."
              className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
            <Calendar size={18} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">May 4 – May 10, 2025</span>
            <ChevronDown size={14} className="text-slate-400 ml-2" />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
            <span className="text-sm font-semibold text-slate-700">All Activity Types</span>
            <ChevronDown size={14} className="text-slate-400 ml-2" />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors">
            <span className="text-sm font-semibold text-slate-700">All Users</span>
            <ChevronDown size={14} className="text-slate-400 ml-2" />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">
            <Filter size={18} /> Filters
          </button>
        </div>

        <ActivityTable />

        <div className="flex flex-col items-center text-center gap-2 pt-6">
          <div className="flex items-center gap-2 text-slate-400 font-medium text-[10px] uppercase tracking-wider">
            <ShieldCheck size={14} /> All activity data is encrypted and stored securely.
          </div>
          <p className="text-slate-400 text-[11px] font-medium">
            Activity logs are for informational purposes and do not replace regulatory judgment.
          </p>
        </div>

      </div>
    </div>
  );
}
