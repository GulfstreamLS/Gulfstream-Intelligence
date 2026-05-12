"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Edit3, ChevronDown, ChevronRight,
  FileText, MessageSquare, AlertCircle, Lightbulb,
  Check, X, Trash2,
} from "lucide-react";
import { chatApi, projectApi } from "../../lib/api";
import type { Project } from "../../types";

// ── Static data ───────────────────────────────────────────────────────────────

const PHASES = ["Discovery", "Preclinical", "Phase 1", "Phase 2", "Phase 3", "BLA/MAA"];

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
  canDelete?: boolean;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ChatSidebarProps {
  onSendMessage: (text: string) => void;
  activeChatId: string | undefined;
  onChatSelect: (chatId: string) => void;
  recentChats: RecentChatItem[];
  onAuthoritiesChange?: (authorities: string[]) => void;
  onProjectChange?: (projectId: string | null) => void;
  initialProjectId?: string;
  onDeleteChat?: (chatId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatSidebar({
  onSendMessage,
  activeChatId,
  onChatSelect,
  recentChats,
  onAuthoritiesChange,
  onProjectChange,
  initialProjectId,
  onDeleteChat,
}: ChatSidebarProps) {
  // Projects fetched from API
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId ?? null);
  const appliedProjectRef = useRef<string | null>(null);

  // Fetch projects once on mount
  useEffect(() => {
    projectApi.list({ page_size: 100 })
      .then(res => setProjects(res.items))
      .catch(() => {});
  }, []);

  // Apply project context whenever initialProjectId changes OR projects list loads
  useEffect(() => {
    if (!initialProjectId || !projects.length) return;
    if (appliedProjectRef.current === initialProjectId) return;
    appliedProjectRef.current = initialProjectId;
    const p = projects.find(p => p.id === initialProjectId);
    if (p) applyProject(p, projects);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProjectId, projects]);

  // Context state
  const [editing, setEditing] = useState(false);
  const [program, setProgram]       = useState("");
  const [indication, setIndication] = useState("");
  const [phase, setPhase]           = useState(PHASES[1]);
  const [activeAuths, setActiveAuths] = useState<number[]>([]);
  const [showAllAuths, setShowAllAuths] = useState(false);

  // Drafts while editing
  const [draftProgram, setDraftProgram]       = useState("");
  const [draftIndication, setDraftIndication] = useState("");
  const [draftPhase, setDraftPhase]           = useState(PHASES[1]);
  const [draftAuths, setDraftAuths]           = useState<number[]>([]);

  function applyProject(p: Project, allProjects: Project[]) {
    const proj = allProjects.find(x => x.id === p.id) ?? p;
    setProgram(proj.name);
    setIndication(proj.indication ?? "");
    setPhase(proj.dev_phase ?? PHASES[1]);
    const auths = (proj.authorities ?? [])
      .map(name => ALL_AUTHORITIES.findIndex(a => a.name === name))
      .filter(i => i >= 0);
    setActiveAuths(auths);
    setSelectedProjectId(proj.id);
    onProjectChange?.(proj.id);
    onAuthoritiesChange?.((proj.authorities ?? []).filter(Boolean));
  }

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

    const authorityNames = ALL_AUTHORITIES
      .filter((_, i) => draftAuths.includes(i))
      .map(a => a.name);
    onAuthoritiesChange?.(authorityNames);

    // Persist project assignment to the current conversation if it changed
    if (selectedProjectId !== appliedProjectRef.current) {
      appliedProjectRef.current = selectedProjectId;
      onProjectChange?.(selectedProjectId);
      if (activeChatId) {
        chatApi.updateConversation(activeChatId, { project_id: selectedProjectId }).catch(console.error);
      }
    }
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
                value={selectedProjectId ?? ""}
                onChange={e => {
                  const proj = projects.find(p => p.id === e.target.value);
                  if (proj) {
                    setDraftProgram(proj.name);
                    setDraftIndication(proj.indication ?? "");
                    setDraftPhase(proj.dev_phase ?? PHASES[1]);
                    setDraftAuths((proj.authorities ?? [])
                      .map(name => ALL_AUTHORITIES.findIndex(a => a.name === name))
                      .filter(i => i >= 0));
                    setSelectedProjectId(proj.id);
                  }
                }}
                className="mt-1 w-full text-sm font-semibold text-gs-text bg-gs-bg border border-gs-border rounded-lg px-3 py-2 focus:outline-none focus:border-gs-blue"
              >
                <option value="">Select program…</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <button
                onClick={startEdit}
                className="flex items-center justify-between mt-1 w-full text-gs-blue font-semibold text-sm text-left"
              >
                <span>{program || "Select program…"}</span>
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
                <input
                  value={draftIndication}
                  onChange={e => setDraftIndication(e.target.value)}
                  className="mt-1 w-full text-[13px] font-semibold text-gs-text bg-gs-bg border border-gs-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-gs-blue"
                  placeholder="e.g. DMD"
                />
              ) : (
                <p className="text-[13px] font-semibold text-gs-text mt-0.5">{indication || "—"}</p>
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
          <Link href="/dashboard/history" className="text-gs-blue text-[11px] font-semibold hover:underline">View all</Link>
        </div>
        <div className="space-y-0.5">
          {recentChats.map(chat => (
            <div
              key={chat.id}
              className={`group/chat w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left cursor-pointer ${
                activeChatId === chat.id
                  ? "bg-gs-blue/10 text-gs-blue dark:bg-gs-blue/20"
                  : "text-gs-muted hover:bg-gs-bg"
              }`}
              onClick={() => onChatSelect(chat.id)}
            >
              <span className="text-xs font-semibold truncate max-w-[160px]">{chat.title}</span>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <span className={`text-[10px] font-medium opacity-60 ${chat.canDelete ? "group-hover/chat:hidden" : ""}`}>
                  {chat.date}
                </span>
                {onDeleteChat && chat.canDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                    className="hidden group-hover/chat:flex items-center justify-center w-6 h-6 rounded-md text-gs-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={`Delete ${chat.title}`}
                    title="Delete chat"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
