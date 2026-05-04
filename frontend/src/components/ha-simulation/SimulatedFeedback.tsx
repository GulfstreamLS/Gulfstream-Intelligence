"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

const TABS = ["Questions (18)", "Feedback Summary", "Meeting Brief", "Response Guidance"] as const;

const TOPICS = [
  { label: "All Topics",           count: 18 },
  { label: "CMC & Manufacturing",  count: 7, active: true },
  { label: "Nonclinical",          count: 5 },
  { label: "Clinical Plan",        count: 3 },
  { label: "Quality Systems",      count: 2 },
  { label: "Regulatory Strategy",  count: 1 },
];

const MINI_QUESTIONS = [
  { id: "Q2", title: "Raw Materials",       tag: "High", color: "text-orange-500 bg-orange-50" },
  { id: "Q3", title: "Facility & Equipment", tag: "High", color: "text-orange-500 bg-orange-50" },
];

export function SimulatedFeedback() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Questions (18)");

  return (
    <div className="lg:col-span-8 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Simulated Authority Feedback</h3>
        <div className="flex gap-6 overflow-x-auto no-scrollbar border-b border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Topic list */}
        <div className="w-full md:w-56 border-r border-slate-100 p-4 space-y-1">
          {TOPICS.map((item) => (
            <div
              key={item.label}
              className={`flex justify-between items-center p-2.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                item.active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {item.label} <span>{item.count}</span>
            </div>
          ))}
        </div>

        {/* Questions */}
        <div className="flex-1 p-6 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-sm">CMC &amp; Manufacturing</h4>
              <span className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">7 Questions</span>
            </div>
            <button className="text-xs font-bold text-slate-400 flex items-center gap-1">
              Group by: Topic <ChevronRight size={14} className="rotate-90" />
            </button>
          </div>

          <div className="p-4 border border-slate-100 rounded-xl bg-[#FAFBFF]">
            <div className="flex justify-between items-start mb-3">
              <span className="text-indigo-600 font-bold text-sm">
                Q1 <span className="ml-2 text-slate-800 font-bold">Process Validation</span>
              </span>
              <span className="bg-red-50 text-red-600 text-[9px] px-2 py-0.5 rounded font-bold uppercase">Critical</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              How have you demonstrated that your manufacturing process is consistently able to produce product meeting predetermined specifications?
            </p>
            <div className="bg-white p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rationale</span>
              <p className="text-xs text-slate-500">
                FDA expects demonstration of process validation with appropriate acceptance criteria and ongoing process verification.
              </p>
            </div>
            <button className="mt-4 text-xs font-bold text-indigo-600 flex items-center gap-1">
              View expectations <ChevronRight size={14} />
            </button>
          </div>

          {MINI_QUESTIONS.map((q) => (
            <div key={q.id} className="flex justify-between items-center p-4 border border-slate-50 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
              <span className="text-slate-800 text-sm font-bold">
                <span className="text-indigo-600 mr-2">{q.id}</span> {q.title}
              </span>
              <div className="flex items-center gap-3">
                <span className={`${q.color} text-[9px] px-2 py-0.5 rounded font-bold uppercase`}>{q.tag}</span>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </div>
          ))}

          <button className="w-full py-2 text-xs font-bold text-indigo-600 border-t border-slate-100 pt-4">
            View all 7 questions →
          </button>
        </div>
      </div>
    </div>
  );
}
