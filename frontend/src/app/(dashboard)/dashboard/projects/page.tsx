import {
  Download, Plus, Search, ChevronDown, Filter, ShieldCheck
} from "lucide-react";
import { ProjectStatCards }      from "@/components/projects/ProjectStatCards";
import { ProjectsTable }         from "@/components/projects/ProjectsTable";
import { GlobalVisibilityBanner } from "@/components/projects/GlobalVisibilityBanner";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Projects</h1>
            <p className="text-slate-500 text-sm mt-1">Organize and manage your regulatory programs and projects in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-blue-600 text-blue-600 rounded-sm text-sm font-bold bg-white hover:bg-blue-50 transition-all shadow-sm">
              <Download size={18} /> Import Project
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-sm text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        <ProjectStatCards />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search projects by name, indication, or therapeutic area..."
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 h-11 cursor-pointer">
            <span className="text-sm font-semibold text-slate-700">All Status</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 h-11 cursor-pointer">
            <span className="text-sm font-semibold text-slate-700">All Therapeutic Areas</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 h-11 cursor-pointer">
            <span className="text-sm font-semibold text-slate-700">All Health Authorities</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
          <button className="flex items-center gap-2 px-4 h-11 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600">
            <Filter size={18} /> Filters
          </button>
        </div>

        <ProjectsTable />
        <GlobalVisibilityBanner />

        <div className="flex flex-col items-center text-center gap-2 pt-6">
          <div className="flex items-center gap-2 text-slate-400 font-medium text-[10px] uppercase tracking-widest">
            <ShieldCheck size={14} /> All project data is encrypted and stored securely.
          </div>
          <p className="text-slate-400 text-[11px] font-medium max-w-2xl">
            AI analysis is for informational purposes and does not replace regulatory judgment.
          </p>
        </div>

      </div>
    </div>
  );
}
