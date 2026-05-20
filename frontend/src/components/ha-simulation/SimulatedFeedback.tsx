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
    <div className="p-4 border border-gs-border rounded-xl bg-gs-bg">
      <div className="flex justify-between items-start mb-3">
        <span className="text-indigo-600 font-bold text-sm">
          Q{index + 1} <span className="ml-2 text-gs-text font-bold">{q.topic}</span>
        </span>
        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${SEV_STYLES[q.severity] ?? SEV_STYLES.Low}`}>
          {q.severity}
        </span>
      </div>
      <p className="text-sm text-gs-muted leading-relaxed mb-4">{q.question}</p>
      {expanded && (
        <div className="bg-gs-card p-3 rounded-lg border border-gs-border mb-3">
          <span className="text-[10px] font-bold text-gs-muted uppercase tracking-wider block mb-1">Rationale</span>
          <p className="text-xs text-gs-muted">{q.rationale}</p>
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
      <div className="w-12 h-12 rounded-full bg-gs-bg border border-gs-border flex items-center justify-center">
        <FileText size={20} className="text-gs-muted" />
      </div>
      <p className="text-sm font-semibold text-gs-muted">No content generated yet.</p>
      <p className="text-xs text-gs-muted">Run a simulation to see results here.</p>
    </div>
  );
}

function Md({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p:      ({ children }) => <p className="text-sm text-gs-muted leading-relaxed mb-3 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-gs-text">{children}</strong>,
        ul:     ({ children }) => <ul className="space-y-1.5 my-3">{children}</ul>,
        ol:     ({ children }) => <ol className="space-y-1.5 my-3 list-none counter-reset-none">{children}</ol>,
        li:     ({ children }) => (
          <li className="flex gap-2 text-sm text-gs-muted leading-relaxed">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span>{children}</span>
          </li>
        ),
        h1: ({ children }) => <h1 className="text-base font-bold text-gs-text mb-2 mt-4 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold text-gs-text mb-2 mt-3 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xs font-bold text-gs-muted uppercase tracking-wide mb-1.5 mt-3 first:mt-0">{children}</h3>,
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
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
          <MessageSquareQuote size={18} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Authority Feedback</p>
          <p className="text-sm font-semibold text-gs-text mt-0.5">Simulated regulatory position on your submission</p>
        </div>
      </div>
      <div className="relative pl-5">
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-purple-400" />
        <div className="bg-gs-bg rounded-r-xl border border-gs-border p-5">
          <Md content={content} />
        </div>
      </div>
      <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-lg">
        <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <CalendarClock size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Meeting Brief</p>
            <p className="text-sm font-semibold text-gs-text mt-0.5">Pre-meeting preparation document</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gs-muted bg-gs-bg border border-gs-border px-2.5 py-1 rounded-full uppercase tracking-wider">
          Confidential
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gs-border" />
        <span className="text-[10px] font-bold text-gs-muted uppercase tracking-widest">Agenda & Key Points</span>
        <div className="h-px flex-1 bg-gs-border" />
      </div>
      <div className="bg-gs-card border border-gs-border rounded-xl shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400" />
        <div className="p-5">
          <Md content={content} />
        </div>
      </div>
      <div className="flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-lg">
        <ShieldCheck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
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
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl border border-orange-100 dark:border-orange-900/50">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
          <ClipboardList size={18} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-orange-500 uppercase tracking-wider">Response Guidance</p>
          <p className="text-sm font-semibold text-gs-text mt-0.5">Strategic recommendations to address authority concerns</p>
        </div>
      </div>
      <div className="bg-gs-card border border-gs-border rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-gs-bg border-b border-gs-border">
          <Lightbulb size={13} className="text-orange-400" />
          <span className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Recommended Actions</span>
        </div>
        <div className="p-5">
          <Md content={content} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(["High Priority", "Medium Priority", "Low Priority"] as const).map((level, i) => (
          <div
            key={level}
            className={`p-3 rounded-lg border text-center ${
              i === 0 ? "bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900/50" :
              i === 1 ? "bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50" :
              "bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50"
            }`}
          >
            <div className={`w-2 h-2 rounded-full mx-auto mb-1.5 ${
              i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-blue-400"
            }`} />
            <p className={`text-[10px] font-bold uppercase tracking-wide ${
              i === 0 ? "text-red-600 dark:text-red-400" : i === 1 ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
            }`}>{level}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonQuestion() {
  return (
    <div className="p-4 border border-gs-border rounded-xl animate-pulse space-y-2">
      <div className="h-3 w-40 bg-gs-border rounded" />
      <div className="h-2 w-full bg-gs-border rounded" />
      <div className="h-2 w-3/4 bg-gs-border rounded" />
    </div>
  );
}

export function SimulatedFeedback({ session, loading }: { session: SimulationSession | null; loading: boolean }) {
  const [activeTab, setActiveTab]     = useState<Tab>("Questions");
  const [activeTopic, setActiveTopic] = useState<string>("All Topics");

  const questions = session?.questions ?? [];

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
    <div className="lg:col-span-8 bg-gs-card rounded-xl border border-gs-border shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-gs-border">
        <h3 className="font-bold text-gs-text mb-4">Simulated Authority Feedback</h3>
        <div className="flex gap-6 overflow-x-auto no-scrollbar border-b border-gs-border">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gs-muted hover:text-gs-text"
              }`}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Questions" ? (
        <div className="flex flex-col md:flex-row flex-1">
          <div className="w-full md:w-56 border-r border-gs-border p-4 space-y-1">
            {loading
              ? [...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gs-border rounded-lg animate-pulse" />)
              : topics.map(item => (
                <div
                  key={item.label}
                  onClick={() => setActiveTopic(item.label)}
                  className={`flex justify-between items-center p-2.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    activeTopic === item.label ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400" : "text-gs-muted hover:bg-gs-bg"
                  }`}
                >
                  {item.label} <span>{item.count}</span>
                </div>
              ))
            }
          </div>

          <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[580px]">
            {loading ? (
              [...Array(3)].map((_, i) => <SkeletonQuestion key={i} />)
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={32} className="text-gs-muted mb-3" />
                <p className="text-sm font-bold text-gs-muted">No questions generated yet.</p>
                <p className="text-xs text-gs-muted mt-1 max-w-sm">
                  Add source context and run the simulation to see authority questions and feedback.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gs-text text-sm">{activeTopic}</h4>
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
          ? <div className="p-6 space-y-3 animate-pulse max-h-[540px]">{[...Array(6)].map((_, i) => <div key={i} className={`h-3 bg-gs-border rounded ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />)}</div>
          : activeTab === "Feedback Summary" ? <FeedbackSummaryTab content={session?.feedback_summary ?? null} />
          : activeTab === "Meeting Brief"    ? <MeetingBriefTab    content={session?.meeting_brief    ?? null} />
          :                                    <ResponseGuidanceTab content={session?.response_guidance ?? null} />
      )}
    </div>
  );
}
