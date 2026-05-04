import { ShieldCheck, HelpCircle, CheckCircle, ChevronRight } from "lucide-react";

const CONCERNS = [
  { text: "Process validation data is limited",                tag: "Critical", color: "bg-red-50 text-red-600" },
  { text: "Incomplete characterization of impurity profile",   tag: "High",     color: "bg-orange-50 text-orange-600" },
  { text: "Insufficient stability data for proposed shelf life", tag: "High",   color: "bg-orange-50 text-orange-600" },
  { text: "Manufacturing facility change control",             tag: "Medium",   color: "bg-yellow-50 text-yellow-600" },
];

const FOLLOWUP = [
  "How will you control lot-to-lot variability?",
  "What is your plan for continuous process verification?",
  "How do you justify your specification limits?",
  "Provide data supporting hold time of drug substance.",
];

const ACTIONS = [
  "Generate additional process validation batches",
  "Expand impurity profiling studies",
  "Provide 12-month stability data",
  "Strengthen change control strategy",
];

export function HaBottomCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Key Concerns */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck size={20} className="text-red-500" />
          <h3 className="font-bold text-slate-800">Key Concerns Identified</h3>
        </div>
        <div className="space-y-4">
          {CONCERNS.map((item) => (
            <div key={item.text} className="flex justify-between items-center gap-3">
              <p className="text-xs font-semibold text-slate-600">{item.text}</p>
              <span className={`${item.color} text-[8px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap`}>{item.tag}</span>
            </div>
          ))}
          <button className="text-xs font-bold text-indigo-600 pt-2 block">View all concerns →</button>
        </div>
      </div>

      {/* Follow-up Questions */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle size={20} className="text-indigo-500" />
          <h3 className="font-bold text-slate-800">Likely Follow-up Questions</h3>
        </div>
        <div className="space-y-4">
          {FOLLOWUP.map((text) => (
            <div key={text} className="flex justify-between items-center group cursor-pointer">
              <p className="text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">{text}</p>
              <ChevronRight size={14} className="text-slate-300" />
            </div>
          ))}
          <button className="text-xs font-bold text-indigo-600 pt-2 block">View all questions →</button>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle size={20} className="text-emerald-500" />
          <h3 className="font-bold text-slate-800">Recommended Actions</h3>
        </div>
        <div className="space-y-4">
          {ACTIONS.map((text) => (
            <div key={text} className="flex justify-between items-center group cursor-pointer">
              <p className="text-xs font-semibold text-slate-600 group-hover:text-emerald-600 transition-colors">{text}</p>
              <ChevronRight size={14} className="text-slate-300" />
            </div>
          ))}
          <button className="text-xs font-bold text-indigo-600 pt-2 block">View all recommendations →</button>
        </div>
      </div>
    </div>
  );
}
