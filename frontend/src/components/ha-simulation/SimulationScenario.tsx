import { ChevronRight, Edit3 } from "lucide-react";

function SelectField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase">{label}</label>
      <div className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg text-sm font-medium">
        {value} <ChevronRight size={14} className="ml-auto rotate-90 text-slate-400" />
      </div>
    </div>
  );
}

export function SimulationScenario() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-slate-800">Simulation Scenario</h2>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Last run: May 10, 2025 10:24 AM</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Health Authority</label>
          <div className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm font-medium">
            <span className="text-lg">🇺🇸</span> FDA (U.S.) <ChevronRight size={14} className="ml-auto rotate-90 text-slate-400" />
          </div>
        </div>
        <SelectField label="Submission Type" value="IND" />
        <SelectField label="Product Type"    value="Biologic" />
        <SelectField label="Stage"           value="Preclinical" />
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Focus Area</label>
            <div className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg text-sm font-medium">
              CMC &amp; Manufacturing <ChevronRight size={14} className="ml-auto rotate-90 text-slate-400" />
            </div>
          </div>
          <button className="p-2.5 mt-auto border border-slate-200 rounded-lg hover:bg-slate-50">
            <Edit3 size={18} className="text-indigo-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
