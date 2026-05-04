import { Download, Plus, ShieldCheck } from "lucide-react";
import { SimulationScenario }  from "../../../../components/ha-simulation/SimulationScenario";
import { HaStatCards }         from "../../../../components/ha-simulation/HaStatCards";
import { SimulatedFeedback }   from "../../../../components/ha-simulation/SimulatedFeedback";
import { SimulationSidePanel } from "../../../../components/ha-simulation/SimulationSidePanel";
import { HaBottomCards }       from "../../../../components/ha-simulation/HaBottomCards";

export default function HealthAuthoritySimulationPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Health Authority Simulation</h1>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Prepare. Anticipate. Respond. Simulate questions and feedback from health authorities to strengthen your position.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
              <Download size={16} className="text-indigo-600" /> Export Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-shadow shadow-md">
              <Plus size={16} /> New Simulation
            </button>
          </div>
        </div>

        <SimulationScenario />
        <HaStatCards />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <SimulatedFeedback />
          <SimulationSidePanel />
        </div>

        <HaBottomCards />

        <div className="flex flex-col items-center text-center border-t border-slate-100 gap-2">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            <ShieldCheck size={14} className="text-emerald-500" />
            Simulations are for preparation purposes only and do not replace official guidance.
          </div>
          <p className="text-slate-400 text-[10px] font-bold">All data is secure and confidential.</p>
        </div>

      </div>
    </div>
  );
}
