"use client";

import { useState } from "react";
import {
  Edit3, ChevronDown, ChevronRight,
  FileText, MessageSquare, AlertCircle, Lightbulb,
  Check, X,
} from "lucide-react";

// ── Static data ───────────────────────────────────────────────────────────────

const PROGRAMS = [
  "AAV Gene Therapy Program",
  "mRNA Vaccine Program",
  "CRISPR Therapeutics Program",
  "CAR-T Cell Therapy Program",
  "Antisense Oligonucleotide Program",
];

const PHASES = ["Discovery", "Preclinical", "Phase 1", "Phase 2", "Phase 3", "BLA/MAA"];

const INDICATIONS = [
  "Duchenne Muscular Dystrophy",
  "Spinal Muscular Atrophy",
  "Hemophilia A",
  "Sickle Cell Disease",
  "Acute Myeloid Leukemia",
  "Beta-Thalassemia",
];

const ALL_AUTHORITIES = [
  { flag: "🇪🇺", name: "EMA" },
  { flag: "🇺🇸", name: "FDA" },
  { flag: "🇨🇦", name: "Health Canada" },
  { flag: "🇯🇵", name: "PMDA" },
  { flag: "🇬🇧", name: "MHRA" },
];

const INSIGHTS = [
  {
    icon: FileText,
    count: 23,
    label: "Relevant Guidelines",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    query: "List the most relevant regulatory guidelines for my current gene therapy program",
  },
  {
    icon: MessageSquare,
    count: 7,
    label: "Key Differences",
    color: "bg-purple-50 text-gs-purple dark:bg-purple-900/20",
    query: "What are the key regulatory differences between EMA and FDA for my target program?",
  },
  {
    icon: AlertCircle,
    count: 5,
    label: "Risk Areas",
    color: "bg-orange-50 text-gs-orange dark:bg-orange-900/20",
    query: "What are the main regulatory risk areas I should be aware of for this program?",
  },
  {
    icon: Lightbulb,
    count: 12,
    label: "Recommendations",
    color: "bg-blue-50 text-gs-blue dark:bg-gs-blue/10",
    query: "What are your top regulatory strategy recommendations for my current program?",
  },
];

const SUGGESTED_PROMPTS = [
  "Compare EMA vs FDA requirements for gene therapy",
  "What are the non-clinical expectations for ATMPs?",
  "List recent EMA approvals for similar products",
  "What are the key CMC requirements for viral vector products?",
];

export interface RecentChatItem {
  id: string;
  title: string;
  date: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ChatSidebarProps {
  onSendMessage: (text: string) => void;
  activeChatId: string | undefined;
  onChatSelect: (chatId: string) => void;
  recentChats: RecentChatItem[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatSidebar({
  onSendMessage,
  activeChatId,
  onChatSelect,
  recentChats,
}: ChatSidebarProps) {
  // Context state
  const [editing, setEditing] = useState(false);
  const [program, setProgram]       = useState(PROGRAMS[0]);
  const [indication, setIndication] = useState(INDICATIONS[0]);
  const [phase, setPhase]           = useState(PHASES[1]);
  const [activeAuths, setActiveAuths] = useState([0, 1, 2]);
  const [showAllAuths, setShowAllAuths] = useState(false);

  // Drafts while editing
  const [draftProgram, setDraftProgram]       = useState(PROGRAMS[0]);
  const [draftIndication, setDraftIndication] = useState(INDICATIONS[0]);
  const [draftPhase, setDraftPhase]           = useState(PHASES[1]);
  const [draftAuths, setDraftAuths]           = useState([0, 1, 2]);

  const startEdit = () => {
    setDraftProgram(program);
    setDraftIndication(indication);
    setDraftPhase(phase);
    setDraftAuths(activeAuths);
    setEditing(true);
  };

  const saveEdit = () => {
    setProgram(draftProgram);
    setIndication(draftIndication);
    setPhase(draftPhase);
    setActiveAuths(draftAuths);
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  const toggleAuthority = (idx: number) => {
    setDraftAuths(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const visibleAuths = ALL_AUTHORITIES.filter((_, i) => activeAuths.includes(i));
  const hiddenCount  = Math.max(0, visibleAuths.length - 2);

  return (
    <>
      {/* ── Context ── */}
      <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xs font-semibold text-gs-muted uppercase tracking-wider">Context</h2>

          {editing ? (
            <div className="flex gap-1">
              <button
                onClick={saveEdit}
                className="p-1.5 text-gs-green hover:bg-gs-bg rounded-lg transition-colors"
                aria-label="Save"
              >
                <Check size={14} />
              </button>
              <button
                onClick={cancelEdit}
                className="p-1.5 text-gs-red hover:bg-gs-bg rounded-lg transition-colors"
                aria-label="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="text-gs-blue text-xs font-semibold flex items-center gap-1 hover:underline"
            >
              <Edit3 size={13} /> Edit
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Active Program */}
          <div>
            <label className="text-[11px] font-semibold text-gs-muted uppercase tracking-wider">
              Active Program
            </label>
            {editing ? (
              <select
                value={draftProgram}
                onChange={e => setDraftProgram(e.target.value)}
                className="mt-1 w-full text-sm font-semibold text-gs-text bg-gs-bg border border-gs-border rounded-lg px-3 py-2 focus:outline-none focus:border-gs-blue"
              >
                {PROGRAMS.map(p => <option key={p}>{p}</option>)}
              </select>
            ) : (
              <button
                onClick={startEdit}
                className="flex items-center justify-between mt-1 w-full text-gs-blue font-semibold text-sm text-left"
              >
                <span>{program}</span>
                <ChevronDown size={15} />
              </button>
            )}
          </div>

          {/* Indication + Phase */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gs-muted uppercase tracking-wider">
                Indication
              </label>
              {editing ? (
                <select
                  value={draftIndication}
                  onChange={e => setDraftIndication(e.target.value)}
                  className="mt-1 w-full text-[13px] font-semibold text-gs-text bg-gs-bg border border-gs-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-gs-blue"
                >
                  {INDICATIONS.map(i => <option key={i}>{i}</option>)}
                </select>
              ) : (
                <p className="text-[13px] font-semibold text-gs-text mt-0.5">{indication}</p>
              )}
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gs-muted uppercase tracking-wider">
                Dev Phase
              </label>
              {editing ? (
                <select
                  value={draftPhase}
                  onChange={e => setDraftPhase(e.target.value)}
                  className="mt-1 w-full text-[13px] font-semibold text-gs-text bg-gs-bg border border-gs-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-gs-blue"
                >
                  {PHASES.map(p => <option key={p}>{p}</option>)}
                </select>
              ) : (
                <p className="text-[13px] font-semibold text-gs-text mt-0.5">{phase}</p>
              )}
            </div>
          </div>

          {/* Target Authorities */}
          <div>
            <label className="text-[11px] font-semibold text-gs-muted uppercase tracking-wider">
              Target Authorities
            </label>

            {editing ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {ALL_AUTHORITIES.map((auth, i) => (
                  <button
                    key={auth.name}
                    onClick={() => toggleAuthority(i)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
                      draftAuths.includes(i)
                        ? "bg-gs-blue/10 border-gs-blue text-gs-blue"
                        : "bg-gs-bg border-gs-border text-gs-muted"
                    }`}
                  >
                    {auth.flag} {auth.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center flex-wrap gap-2 mt-2">
                {(showAllAuths ? visibleAuths : visibleAuths.slice(0, 2)).map(auth => (
                  <div
                    key={auth.name}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-gs-bg border border-gs-border rounded text-xs font-semibold text-gs-muted"
                  >
                    <span>{auth.flag}</span>
                    <span>{auth.name}</span>
                  </div>
                ))}
                {!showAllAuths && hiddenCount > 0 && (
                  <button
                    onClick={() => setShowAllAuths(true)}
                    className="text-[11px] font-semibold text-gs-muted bg-gs-bg px-2.5 py-1 rounded border border-gs-border hover:border-gs-blue hover:text-gs-blue transition-colors"
                  >
                    +{hiddenCount} more
                  </button>
                )}
                {showAllAuths && hiddenCount > 0 && (
                  <button
                    onClick={() => setShowAllAuths(false)}
                    className="text-[11px] font-semibold text-gs-muted bg-gs-bg px-2.5 py-1 rounded border border-gs-border hover:border-gs-blue hover:text-gs-blue transition-colors"
                  >
                    Show less
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Key Insights ── */}
      <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card">
        <h2 className="text-xs font-semibold text-gs-muted uppercase tracking-wider mb-2">
          Key Insights
        </h2>
        <p className="text-[11px] text-gs-muted mb-3">Click any insight to ask about it</p>
        <div>
          {INSIGHTS.map(({ icon: Icon, count, label, color, query }) => (
            <button
              key={label}
              onClick={() => onSendMessage(query)}
              className="w-full flex items-center justify-between py-3 border-b border-gs-border last:border-0 hover:bg-gs-bg -mx-1 px-1 rounded-lg transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${color}`}>
                  <Icon size={15} />
                </div>
                <span className="text-[13px] font-semibold text-gs-muted group-hover:text-gs-text transition-colors">
                  {label}
                </span>
              </div>
              <span className="text-base font-bold text-gs-text">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Suggested Prompts ── */}
      <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card">
        <h2 className="text-xs font-semibold text-gs-muted uppercase tracking-wider mb-4">
          Suggested Prompts
        </h2>
        <div className="space-y-2.5">
          {SUGGESTED_PROMPTS.map(text => (
            <button
              key={text}
              onClick={() => onSendMessage(text)}
              className="w-full flex items-center justify-between p-3.5 bg-gs-bg border border-gs-border rounded-xl hover:border-gs-blue group transition-colors text-left"
            >
              <p className="text-xs font-semibold text-gs-muted group-hover:text-gs-blue leading-tight">
                {text}
              </p>
              <ChevronRight size={14} className="text-gs-border group-hover:text-gs-blue shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Chats ── */}
      <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-semibold text-gs-muted uppercase tracking-wider">
            Recent Chats
          </h2>
          <button className="text-gs-blue text-[11px] font-semibold hover:underline">View all</button>
        </div>
        <div className="space-y-0.5">
          {recentChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                activeChatId === chat.id
                  ? "bg-gs-blue/10 text-gs-blue dark:bg-gs-blue/20"
                  : "text-gs-muted hover:bg-gs-bg"
              }`}
            >
              <span className="text-xs font-semibold truncate max-w-[180px]">{chat.title}</span>
              <span className="text-[10px] font-medium opacity-60 ml-2 shrink-0">{chat.date}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
