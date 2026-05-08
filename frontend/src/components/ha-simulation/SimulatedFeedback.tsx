"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronRight, FileText, MessageSquareQuote, CalendarClock,
  Lightbulb, ShieldCheck, AlertCircle, ClipboardList,
} from "lucide-react";
import type { SimulationSession, SimQuestion } from "../../types";

const TABS = ["Questions", "Feedback Summary", "Meeting Brief", "Response Guidance"] as const;
type Tab = typeof TABS[number];

const SEV_STYLES: Record<string, string> = {
  Critical: "bg-red-50 text-red-600",
  High:     "bg-orange-50 text-orange-500",
  Medium:   "bg-yellow-50 text-yellow-600",
  Low:      "bg-emerald-50 text-emerald-600",
};

function QuestionCard({ q, index }: { q: SimQuestion; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="p-4 border border-slate-100 rounded-xl bg-[#FAFBFF]">
      <div className="flex justify-between items-start mb-3">
        <span className="text-indigo-600 font-bold text-sm">
          Q{index + 1} <span className="ml-2 text-slate-800 font-bold">{q.topic}</span>
        </span>
        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${SEV_STYLES[q.severity] ?? SEV_STYLES.Low}`}>
          {q.severity}
        </span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-4">{q.question}</p>
      {expanded && (
        <div className="bg-white p-3 rounded-lg border border-slate-100 mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rationale</span>
          <p className="text-xs text-slate-500">{q.rationale}</p>
        </div>
      )}
      <button
        onClick={() => setExpanded(e => !e)}
        className="text-xs font-bold text-indigo-600 flex items-center gap-1"
      >
        {expanded ? "Hide rationale" : "View rationale"} <ChevronRight size={14} className={expanded ? "rotate-90" : ""} />
      </button>
    </div>
  );
}

function EmptyTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
        <FileText size={20} className="text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-400">No content generated yet.</p>
      <p className="text-xs text-slate-300">Run a simulation to see results here.</p>
    </div>
  );
}

function Md({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p:      ({ children }) => <p className="text-sm text-slate-600 leading-relaxed mb-3 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-slate-800">{children}</strong>,
        ul:     ({ children }) => <ul className="space-y-1.5 my-3">{children}</ul>,
        ol:     ({ children }) => <ol className="space-y-1.5 my-3 list-none counter-reset-none">{children}</ol>,
        li:     ({ children }) => (
          <li className="flex gap-2 text-sm text-slate-600 leading-relaxed">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span>{children}</span>
          </li>
        ),
        h1: ({ children }) => <h1 className="text-base font-bold text-slate-800 mb-2 mt-4 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold text-slate-700 mb-2 mt-3 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 mt-3 first:mt-0">{children}</h3>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function FeedbackSummaryTab({ content }: { content: string | null }) {
  if (!content) return <EmptyTab />;
  return (
    <div className="p-6 space-y-5 max-h-[540px] overflow-y-auto">
      {/* Header banner */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <MessageSquareQuote size={18} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Authority Feedback</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">Simulated regulatory position on your submission</p>
        </div>
      </div>

      {/* Quote card */}
      <div className="relative pl-5">
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-purple-400" />
        <div className="bg-slate-50 rounded-r-xl border border-slate-100 p-5">
          <Md content={content} />
        </div>
      </div>

      {/* Footer note */}
      <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-lg">
        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
          This feedback is AI-simulated based on known regulatory expectations. Use it to identify gaps and refine your strategy before official submission.
        </p>
      </div>
    </div>
  );
}

function MeetingBriefTab({ content }: { content: string | null }) {
  if (!content) return <EmptyTab />;
  return (
    <div className="p-6 space-y-5 max-h-[540px] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <CalendarClock size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Meeting Brief</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">Pre-meeting preparation document</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Confidential
        </span>
      </div>

      {/* Divider with label */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agenda & Key Points</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      {/* Content in agenda-style card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />
        <div className="p-5">
          <Md content={content} />
        </div>
      </div>

      {/* Preparation reminder */}
      <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
        <ShieldCheck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
          Review all referenced documents before the meeting. Ensure your team is aligned on responses to anticipated questions.
        </p>
      </div>
    </div>
  );
}

function ResponseGuidanceTab({ content }: { content: string | null }) {
  if (!content) return <EmptyTab />;
  return (
    <div className="p-6 space-y-5 max-h-[540px] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
          <ClipboardList size={18} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">Response Guidance</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">Strategic recommendations to address authority concerns</p>
        </div>
      </div>

      {/* Strategy card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
          <Lightbulb size={13} className="text-orange-400" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Recommended Actions</span>
        </div>
        <div className="p-5">
          <Md content={content} />
        </div>
      </div>

      {/* Priority callout */}
      <div className="grid grid-cols-3 gap-3">
        {(["High Priority", "Medium Priority", "Low Priority"] as const).map((level, i) => (
          <div
            key={level}
            className={`p-3 rounded-lg border text-center ${
              i === 0 ? "bg-red-50 border-red-100" :
              i === 1 ? "bg-amber-50 border-amber-100" :
              "bg-blue-50 border-blue-100"
            }`}
          >
            <div className={`w-2 h-2 rounded-full mx-auto mb-1.5 ${
              i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-blue-400"
            }`} />
            <p className={`text-[10px] font-bold uppercase tracking-wide ${
              i === 0 ? "text-red-600" : i === 1 ? "text-amber-600" : "text-blue-600"
            }`}>{level}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonQuestion() {
  return (
    <div className="p-4 border border-slate-100 rounded-xl animate-pulse space-y-2">
      <div className="h-3 w-40 bg-slate-200 rounded" />
      <div className="h-2 w-full bg-slate-100 rounded" />
      <div className="h-2 w-3/4 bg-slate-100 rounded" />
    </div>
  );
}

export function SimulatedFeedback({ session, loading }: { session: SimulationSession | null; loading: boolean }) {
  const [activeTab, setActiveTab]     = useState<Tab>("Questions");
  const [activeTopic, setActiveTopic] = useState<string>("All Topics");

  const questions = session?.questions ?? [];

  // Build topic list from real data
  const topicCounts: Record<string, number> = {};
  for (const q of questions) {
    topicCounts[q.topic] = (topicCounts[q.topic] ?? 0) + 1;
  }
  const topics = [
    { label: "All Topics", count: questions.length },
    ...Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count })),
  ];

  const visibleQuestions = activeTopic === "All Topics"
    ? questions
    : questions.filter(q => q.topic === activeTopic);

  const tabLabel = (t: Tab) => t === "Questions" ? `Questions (${questions.length})` : t;

  return (
    <div className="lg:col-span-8 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Simulated Authority Feedback</h3>
        <div className="flex gap-6 overflow-x-auto no-scrollbar border-b border-slate-100">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Questions" ? (
        <div className="flex flex-col md:flex-row flex-1">
          {/* Topic sidebar */}
          <div className="w-full md:w-56 border-r border-slate-100 p-4 space-y-1">
            {loading
              ? [...Array(5)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />)
              : topics.map(item => (
                <div
                  key={item.label}
                  onClick={() => setActiveTopic(item.label)}
                  className={`flex justify-between items-center p-2.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    activeTopic === item.label ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {item.label} <span>{item.count}</span>
                </div>
              ))
            }
          </div>

          {/* Questions list */}
          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[580px]">
            {loading ? (
              [...Array(3)].map((_, i) => <SkeletonQuestion key={i} />)
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={32} className="text-slate-200 mb-3" />
                <p className="text-sm font-bold text-slate-400">No questions generated yet.</p>
                <p className="text-xs text-slate-300 mt-1">Run a simulation to see questions.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">{activeTopic}</h4>
                    <span className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                      {visibleQuestions.length} Questions
                    </span>
                  </div>
                </div>
                {visibleQuestions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)}
              </>
            )}
          </div>
        </div>
      ) : (
        loading
          ? <div className="p-6 space-y-3 animate-pulse max-h-[540px]">{[...Array(6)].map((_, i) => <div key={i} className={`h-3 bg-slate-100 rounded ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />)}</div>
          : activeTab === "Feedback Summary" ? <FeedbackSummaryTab content={session?.feedback_summary ?? null} />
          : activeTab === "Meeting Brief"    ? <MeetingBriefTab    content={session?.meeting_brief    ?? null} />
          :                                    <ResponseGuidanceTab content={session?.response_guidance ?? null} />
      )}
    </div>
  );
}
