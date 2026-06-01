"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Edit3, ChevronDown, ChevronRight,
  FileText, MessageSquare, AlertCircle, Lightbulb,
  Check, X, Trash2, FolderPlus, BookMarked, NotebookPen,
  ChevronLeft, Tag,
} from "lucide-react";
import { chatApi, projectApi, regulatoryApi } from "../../lib/api";
import type { Project } from "../../types";
import type { ChatMode } from "./ChatHeader";
import { FlagIcon, AUTHORITY_COUNTRY_CODE } from "../ui/FlagIcon";
import { FilterDropdown } from "../ui/FilterDropdown";
import { getChatModelLabel } from "../../lib/chatModels";
import { useChatStore } from "../../store/chatStore";

// ── Static data ───────────────────────────────────────────────────────────────

const PHASES = ["Discovery", "Preclinical", "Phase 1", "Phase 2", "Phase 3", "BLA/MAA"];

const DEFAULT_AUTHORITIES = [
  { name: "EMA" },
  { name: "FDA" },
  { name: "Health Canada" },
  { name: "PMDA" },
  { name: "MHRA" },
];

const INSIGHT_DEFINITIONS = [
  {
    icon: FileText,
    key: "guidelines" as const,
    label: "Relevant Guidelines",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    query: "List the most relevant regulatory guidelines for my current gene therapy program",
  },
  {
    icon: MessageSquare,
    key: "differences" as const,
    label: "Key Differences",
    color: "bg-purple-50 text-gs-purple dark:bg-purple-900/20",
    query: "What are the key regulatory differences between EMA and FDA for my target program?",
  },
  {
    icon: AlertCircle,
    key: "riskAreas" as const,
    label: "Risk Areas",
    color: "bg-orange-50 text-gs-orange dark:bg-orange-900/20",
    query: "What are the main regulatory risk areas I should be aware of for this program?",
  },
  {
    icon: Lightbulb,
    key: "recommendations" as const,
    label: "Recommendations",
    color: "bg-blue-50 text-gs-blue dark:bg-gs-blue/10",
    query: "What are your top regulatory strategy recommendations for my current program?",
  },
];

export interface InsightCounts {
  guidelines: number;
  differences: number;
  riskAreas: number;
  recommendations: number;
}

const GENERAL_SUGGESTED_PROMPTS = [
  "What are today's top life science industry updates?",
  "Summarize recent FDA news.",
  "Help me draft a LinkedIn post about regulatory strategy.",
  "Explain recent biotech funding trends.",
];

const PROGRAM_NO_PROJECT_SUGGESTED_PROMPTS = [
  "What are recent FDA updates on accelerated approval?",
  "What are current EMA expectations for ATMPs?",
  "What are common IND gaps for oncology programs?",
  "What are FDA expectations for CMC comparability?",
];

const PROGRAM_WITH_PROJECT_SUGGESTED_PROMPTS = [
  "What are the top risks for this program?",
  "What would FDA likely question?",
  "Summarize the key regulatory gaps.",
  "What are the next steps for submission readiness?",
];

const SAVE_CATEGORIES = [
  "Note", "Risk", "Gap", "Decision", "Assumption", "Action Item", "Executive Summary",
];

type SaveStep =
  | "options"
  | "selectProgram"
  | "createProgram"
  | "generalNote"
  | "saveCore"
  | "saved";

function SavePanel({
  activeChatId,
  chatMode,
  currentProgramId,
  currentProgramName,
  projects,
  onSaved,
  onMarkedTemporary,
  onDismiss,
}: {
  activeChatId: string;
  chatMode: ChatMode;
  currentProgramId: string | null;
  currentProgramName: string;
  projects: Project[];
  onSaved: (project: Project | null) => void;
  onMarkedTemporary?: (chatId: string) => void;
  onDismiss: () => void;
}) {
  const [step, setStep] = useState<SaveStep>("options");
  const [selectedProjectId, setSelectedProjectId] = useState(currentProgramId ?? "");
  const [category, setCategory] = useState("Note");
  const [newProgramName, setNewProgramName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (step === "saved") {
      const timer = setTimeout(() => {
        setStep("options");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  async function saveToProgram(projectId: string) {
    setSaving(true);
    try {
      await chatApi.updateConversation(activeChatId, { 
        project_id: projectId, 
        is_temporary: false, 
        metadata: { category } 
      });
      useChatStore.getState().updateConversation(activeChatId, {
        project_id: projectId,
        is_temporary: false,
        category: category,
      });
      const proj = projects.find(p => p.id === projectId) ?? null;
      onSaved(proj);
      setStep("saved");
    } catch { /* silently fail */ }
    setSaving(false);
  }

  async function createAndSave() {
    if (!newProgramName.trim()) return;
    setSaving(true);
    try {
      const proj = await projectApi.create({ name: newProgramName.trim() });
      await chatApi.updateConversation(activeChatId, { 
        project_id: proj.id, 
        is_temporary: false, 
        metadata: { category } 
      });
      useChatStore.getState().updateConversation(activeChatId, {
        project_id: proj.id,
        is_temporary: false,
        category: category,
        project_name: proj.name,
      });
      onSaved(proj);
      setStep("saved");
    } catch { /* silently fail */ }
    setSaving(false);
  }

  async function markTemporary() {
    try {
      await chatApi.updateConversation(activeChatId, { is_temporary: true });
      onMarkedTemporary?.(activeChatId);
    } catch { /* silently fail */ }
    onDismiss();
  }

  if (step === "saved") {
    return (
      <div className="bg-gs-card p-4 rounded-card border border-gs-green/30 shadow-card">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gs-green/10 rounded-lg shrink-0">
            <Check size={14} className="text-gs-green" />
          </div>
          <p className="text-xs font-semibold text-gs-text">Chat saved successfully.</p>
        </div>
      </div>
    );
  }

  if (step === "selectProgram") {
    return (
      <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => setStep("options")} className="text-gs-muted hover:text-gs-text transition-colors">
            <ChevronLeft size={15} />
          </button>
          <h2 className="text-xs font-semibold text-gs-text">Save to a Program</h2>
        </div>
        <FilterDropdown
          fullWidth
          value={selectedProjectId || ""}
          onChange={v => setSelectedProjectId(v)}
          options={[
            { value: "", label: "Select program…" },
            ...projects.map(p => ({ value: p.id, label: p.name })),
          ]}
        />
        <div>
          <label className="text-[11px] font-semibold text-gs-muted uppercase tracking-wider block mb-1.5">
            <Tag size={10} className="inline mr-1" />Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SAVE_CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  category === c
                    ? "bg-gs-blue/10 border-gs-blue text-gs-blue"
                    : "bg-gs-bg border-gs-border text-gs-muted hover:border-gs-blue hover:text-gs-blue"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            disabled={!selectedProjectId || saving}
            onClick={() => saveToProgram(selectedProjectId)}
            className="flex-1 px-3 py-2 bg-gs-blue text-white rounded-lg text-xs font-semibold hover:bg-gs-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setStep("options")} className="px-3 py-2 bg-gs-bg border border-gs-border text-gs-muted rounded-lg text-xs font-semibold hover:bg-gs-card transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === "createProgram") {
    return (
      <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => setStep("options")} className="text-gs-muted hover:text-gs-text transition-colors">
            <ChevronLeft size={15} />
          </button>
          <h2 className="text-xs font-semibold text-gs-text">Create New Program</h2>
        </div>
        <input
          value={newProgramName}
          onChange={e => setNewProgramName(e.target.value)}
          placeholder="Program name…"
          className="w-full text-sm text-gs-text bg-gs-bg border border-gs-border rounded-lg px-3 py-2 focus:outline-none focus:border-gs-blue placeholder:text-gs-muted"
        />
        <div>
          <label className="text-[11px] font-semibold text-gs-muted uppercase tracking-wider block mb-1.5">
            <Tag size={10} className="inline mr-1" />Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SAVE_CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  category === c
                    ? "bg-gs-blue/10 border-gs-blue text-gs-blue"
                    : "bg-gs-bg border-gs-border text-gs-muted hover:border-gs-blue hover:text-gs-blue"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            disabled={!newProgramName.trim() || saving}
            onClick={createAndSave}
            className="flex-1 px-3 py-2 bg-gs-blue text-white rounded-lg text-xs font-semibold hover:bg-gs-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Creating…" : "Create & Save"}
          </button>
          <button onClick={() => setStep("options")} className="px-3 py-2 bg-gs-bg border border-gs-border text-gs-muted rounded-lg text-xs font-semibold hover:bg-gs-card transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === "generalNote") {
    return (
      <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => setStep("options")} className="text-gs-muted hover:text-gs-text transition-colors">
            <ChevronLeft size={15} />
          </button>
          <h2 className="text-xs font-semibold text-gs-text">Save as General Note</h2>
        </div>
        <p className="text-[12px] text-gs-muted leading-relaxed">
          This chat will be saved as a general regulatory note — not linked to any specific program.
        </p>
        <div>
          <label className="text-[11px] font-semibold text-gs-muted uppercase tracking-wider block mb-1.5">
            <Tag size={10} className="inline mr-1" />Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SAVE_CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  category === c
                    ? "bg-gs-blue/10 border-gs-blue text-gs-blue"
                    : "bg-gs-bg border-gs-border text-gs-muted hover:border-gs-blue hover:text-gs-blue"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await chatApi.updateConversation(activeChatId, { 
                  project_id: null, 
                  is_temporary: false, 
                  metadata: { category } 
                });
                useChatStore.getState().updateConversation(activeChatId, {
                  project_id: null,
                  is_temporary: false,
                  category: category,
                });
              } catch { /* silently fail */ }
              setSaving(false);
              onSaved(null);
              setStep("saved");
            }}
            className="flex-1 px-3 py-2 bg-gs-blue text-white rounded-lg text-xs font-semibold hover:bg-gs-blue/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Note"}
          </button>
          <button onClick={() => setStep("options")} className="px-3 py-2 bg-gs-bg border border-gs-border text-gs-muted rounded-lg text-xs font-semibold hover:bg-gs-card transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === "saveCore") {
    return (
      <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => setStep("options")} className="text-gs-muted hover:text-gs-text transition-colors">
            <ChevronLeft size={15} />
          </button>
          <h2 className="text-xs font-semibold text-gs-text">Save to Regulatory Core</h2>
        </div>
        <p className="text-[12px] text-gs-muted leading-relaxed">
          This chat will be saved directly into **{currentProgramName}**&apos;s core regulatory knowledge base.
        </p>
        <div>
          <label className="text-[11px] font-semibold text-gs-muted uppercase tracking-wider block mb-1.5">
            <Tag size={10} className="inline mr-1" />Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SAVE_CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  category === c
                    ? "bg-gs-blue/10 border-gs-blue text-gs-blue"
                    : "bg-gs-bg border-gs-border text-gs-muted hover:border-gs-blue hover:text-gs-blue"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            disabled={saving}
            onClick={() => saveToProgram(currentProgramId!)}
            className="flex-1 px-3 py-2 bg-gs-blue text-white rounded-lg text-xs font-semibold hover:bg-gs-blue/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save to Core"}
          </button>
          <button onClick={() => setStep("options")} className="px-3 py-2 bg-gs-bg border border-gs-border text-gs-muted rounded-lg text-xs font-semibold hover:bg-gs-card transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Step: options ──
  const hasProgram = !!currentProgramId;

  const options = (() => {
    if (chatMode === "general") {
      return [
        {
          icon: <NotebookPen size={14} className="text-gs-green" />,
          label: "Save as General Regulatory Note",
          description: "Keep this chat as a standalone note.",
          onClick: () => setStep("generalNote"),
        },
        {
          icon: <X size={14} className="text-gs-muted" />,
          label: "Do Not Save",
          description: "Mark as temporary. Auto-deleted after 1 hour of inactivity.",
          onClick: markTemporary,
          variant: "muted",
        },
      ];
    }

    // Program Mode
    if (hasProgram) {
      // Program Selected: only show Save to Regulatory Core and Do Not Save
      return [
        {
          icon: <BookMarked size={14} className="text-gs-blue" />,
          label: "Save to Regulatory Core",
          description: `Add directly to ${currentProgramName}'s core knowledge base.`,
          onClick: () => setStep("saveCore"),
        },
        {
          icon: <X size={14} className="text-gs-muted" />,
          label: "Do Not Save",
          description: "Mark as temporary. Auto-deleted after 1 hour of inactivity.",
          onClick: markTemporary,
          variant: "muted",
        },
      ];
    } else {
      // Program Not Selected: show Save to Existing, Create New, Save as General Regulatory Note, and Do Not Save
      return [
        {
          icon: <FolderPlus size={14} className="text-gs-blue" />,
          label: "Save to Existing Program",
          description: "Link this chat to one of your programs.",
          onClick: () => { setSelectedProjectId(""); setStep("selectProgram"); },
        },
        {
          icon: <FolderPlus size={14} className="text-gs-purple" />,
          label: "Create New Program from This Chat",
          description: "Start a new program using this conversation.",
          onClick: () => setStep("createProgram"),
        },
        {
          icon: <NotebookPen size={14} className="text-gs-green" />,
          label: "Save as General Regulatory Note",
          description: "Keep this chat without linking to a program.",
          onClick: () => setStep("generalNote"),
        },
        {
          icon: <X size={14} className="text-gs-muted" />,
          label: "Do Not Save",
          description: "Mark as temporary. Auto-deleted after 1 hour of inactivity.",
          onClick: markTemporary,
          variant: "muted",
        },
      ];
    }
  })();

  return (
    <div className="bg-gs-card p-5 rounded-card border border-gs-blue/20 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-xs font-semibold text-gs-text">Save this chat?</h2>
          <p className="text-[11px] text-gs-muted mt-0.5">
            {chatMode === "general"
              ? "General chats are not saved automatically."
              : "Choose how to organize this conversation."}
          </p>
        </div>
        <button onClick={onDismiss} className="text-gs-muted hover:text-gs-text transition-colors ml-2 shrink-0 mt-0.5">
          <X size={14} />
        </button>
      </div>
      <div className="space-y-1">
        {options.map(opt => (
          <button
            key={opt.label}
            onClick={opt.onClick}
            disabled={saving}
            className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
              opt.variant === "muted"
                ? "border-gs-border text-gs-muted hover:bg-gs-bg"
                : "border-gs-border hover:border-gs-blue hover:bg-gs-blue/5 text-gs-text"
            } disabled:opacity-50`}
          >
            <div className="mt-0.5 shrink-0">{opt.icon}</div>
            <div className="min-w-0">
              <p className={`text-[12px] font-semibold leading-tight ${opt.variant === "muted" ? "text-gs-muted" : "text-gs-text"}`}>{opt.label}</p>
              <p className="text-[11px] text-gs-muted mt-0.5 leading-snug">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Chat history row ──────────────────────────────────────────────────────────

function ChatHistoryRow({
  chat,
  isActive,
  onSelect,
  onDelete,
  deleteDisabled,
}: {
  chat: RecentChatItem;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
}) {
  const modeBadge = chat.chatMode === "general"
    ? { label: "General", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" }
    : { label: "Program", cls: "bg-gs-blue/10 text-gs-blue" };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "Risk":
        return "bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-950/40";
      case "Gap":
        return "bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-950/40";
      case "Decision":
        return "bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-950/40";
      case "Assumption":
        return "bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-950/40";
      case "Action Item":
        return "bg-green-50 text-green-600 border border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-950/40";
      case "Executive Summary":
        return "bg-cyan-50 text-cyan-600 border border-cyan-100 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-950/40";
      default:
        return "bg-gs-bg border border-gs-border text-gs-muted";
    }
  };

  return (
    <div
      className={`group/chat w-full flex items-start justify-between p-3 rounded-lg transition-colors text-left cursor-pointer ${
        isActive ? "bg-gs-blue/10 text-gs-blue dark:bg-gs-blue/20" : "text-gs-muted hover:bg-gs-bg"
      }`}
      onClick={onSelect}
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-xs font-semibold truncate">{chat.title}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {chat.chatMode && (
            <span className={`text-[9px] font-bold pr-1.5 py-0.5 rounded ${modeBadge.cls}`}>
              {modeBadge.label}
            </span>
          )}
          {chat.category && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${getCategoryBadgeClass(chat.category)}`}>
              {chat.category}
            </span>
          )}
          {chat.models && chat.models.map(m => (
            <span key={m} className="text-[9px] font-medium bg-gs-bg border border-gs-border text-gs-muted px-1.5 py-0.5 rounded truncate max-w-[80px]">
              {getChatModelLabel(m)}
            </span>
          ))}
          {chat.projectName && (
            <span className="text-[9px] font-medium text-gs-muted truncate max-w-[80px]">
              {chat.projectName}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2 shrink-0 mt-0.5">
        <span className={`text-[10px] font-medium opacity-60 ${chat.canDelete ? "group-hover/chat:hidden" : ""}`}>
          {chat.date}
        </span>
        {onDelete && chat.canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); if (!deleteDisabled) onDelete(); }}
            disabled={deleteDisabled}
            className="hidden group-hover/chat:flex items-center justify-center w-6 h-6 rounded-md text-gs-muted hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gs-muted disabled:hover:bg-transparent"
            aria-label={`Delete ${chat.title}`}
            title={deleteDisabled ? "Wait for the current response to finish" : "Delete chat"}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

export interface RecentChatItem {
  id: string;
  title: string;
  date: string;
  canDelete?: boolean;
  chatMode?: string | null;
  projectName?: string | null;
  models?: string[];
  category?: string | null;
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
  insightCounts?: InsightCounts | null;
  chatMode?: ChatMode;
  actionsDisabled?: boolean;
  onTemporaryMarked?: (chatId: string) => void;
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
  insightCounts,
  chatMode = "program",
  actionsDisabled,
  onTemporaryMarked,
}: ChatSidebarProps) {
  // Projects fetched from API
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId ?? null);
  const [allAuthorities, setAllAuthorities] = useState<{ name: string }[]>([]);
  const appliedProjectRef = useRef<string | null>(null);

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

  // Save panel visibility — reset each time the active chat changes
  const [savePanelDismissed, setSavePanelDismissed] = useState(false);

  // Fetch projects and authorities once on mount
  useEffect(() => {
    projectApi.list({ page_size: 100 })
      .then(res => setProjects(res.items))
      .catch(() => {});

    regulatoryApi.listAuthorities()
      .then(auths => {
        if (Array.isArray(auths) && auths.length > 0) {
          setAllAuthorities(auths.map(name => ({ name })));
        } else {
          setAllAuthorities(DEFAULT_AUTHORITIES);
        }
      })
      .catch(() => {
        setAllAuthorities(DEFAULT_AUTHORITIES);
      });
  }, []);

  // Apply project context whenever initialProjectId changes OR projects list loads OR allAuthorities loads
  useEffect(() => {
    if (!initialProjectId) {
      // Conversation has no linked program — clear the context panel
      if (appliedProjectRef.current !== null) {
        appliedProjectRef.current = null;
        setSelectedProjectId(null);
        setProgram("");
        setIndication("");
        setPhase(PHASES[1]);
        setActiveAuths([]);
      }
      return;
    }
    if (!projects.length || !allAuthorities.length) return;
    
    const p = projects.find(p => p.id === initialProjectId);
    if (p) {
      const hasAuthorities = p.authorities && p.authorities.length > 0;
      const needsMapping = hasAuthorities && activeAuths.length === 0;
      if (appliedProjectRef.current !== initialProjectId || needsMapping) {
        applyProject(p, projects);
        appliedProjectRef.current = initialProjectId;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProjectId, projects, allAuthorities, activeAuths]);

  useEffect(() => { setSavePanelDismissed(false); }, [activeChatId]);

  function applyProject(p: Project, allProjects: Project[]) {
    const proj = allProjects.find(x => x.id === p.id) ?? p;
    setProgram(proj.name);
    setIndication(proj.indication ?? "");
    setPhase(proj.dev_phase ?? PHASES[1]);
    const auths = (proj.authorities ?? [])
      .map(name => allAuthorities.findIndex(a => a.name === name))
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

    const authorityNames = allAuthorities
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

  const clearProgram = () => {
    setProgram("");
    setIndication("");
    setPhase(PHASES[1]);
    setActiveAuths([]);
    setSelectedProjectId(null);
    appliedProjectRef.current = null;
    onProjectChange?.(null);
    if (activeChatId) {
      chatApi.updateConversation(activeChatId, { project_id: null }).catch(console.error);
    }
  };

  const toggleAuthority = (idx: number) => {
    setDraftAuths(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const visibleAuths = allAuthorities.filter((_, i) => activeAuths.includes(i));
  const hiddenCount  = Math.max(0, visibleAuths.length - 2);

  const hasProgram = chatMode === "program" && !!program;

  const suggestedPrompts =
    chatMode === "general"
      ? GENERAL_SUGGESTED_PROMPTS
      : hasProgram
      ? PROGRAM_WITH_PROJECT_SUGGESTED_PROMPTS
      : PROGRAM_NO_PROJECT_SUGGESTED_PROMPTS;

  const modeBadgeLabel = chatMode === "general" ? "Mode: General" : "Mode: Program";

  return (
    <>
      {/* ── Context ── */}
      <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card">
        {/* Header row: CONTEXT + mode badge + edit */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-gs-muted uppercase tracking-wider">Context</h2>
            <span className="px-2 py-0.5 bg-gs-blue/10 text-gs-blue text-[10px] font-semibold rounded-full">
              {modeBadgeLabel}
            </span>
          </div>

          {chatMode === "program" && (
            editing ? (
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
            )
          )}
        </div>

        {/* ── General Mode body ── */}
        {chatMode === "general" && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-gs-muted uppercase tracking-wider">
                General Use
              </label>
              <p className="text-[13px] text-gs-muted mt-1">Not tied to a selected program.</p>
            </div>
          </div>
        )}

        {/* ── Program Mode, no program ── */}
        {chatMode === "program" && !hasProgram && !editing && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-gs-muted uppercase tracking-wider">Program</label>
              <button
                onClick={startEdit}
                className="flex items-center justify-between mt-1 w-full text-gs-blue font-semibold text-sm text-left"
              >
                <span>None selected</span>
                <ChevronDown size={15} />
              </button>
            </div>
            <p className="text-[12px] text-gs-muted leading-relaxed">
              User can ask regulatory or industry questions now and save this chat to a program later.
            </p>
          </div>
        )}

        {/* ── Program Mode, editing or has program ── */}
        {chatMode === "program" && (editing || hasProgram) && (
          <div className="space-y-4">
            {/* Active Program */}
            <div>
              <label className="text-[11px] font-semibold text-gs-muted uppercase tracking-wider">
                Active Program
              </label>
              {editing ? (
                <div className="mt-1">
                  <FilterDropdown
                    fullWidth
                    value={selectedProjectId ?? ""}
                    onChange={v => {
                      const proj = projects.find(p => p.id === v);
                      if (proj) {
                        setDraftProgram(proj.name);
                        setDraftIndication(proj.indication ?? "");
                        setDraftPhase(proj.dev_phase ?? PHASES[1]);
                        setDraftAuths((proj.authorities ?? [])
                          .map(name => allAuthorities.findIndex(a => a.name === name))
                          .filter(i => i >= 0));
                        setSelectedProjectId(proj.id);
                      } else {
                        setDraftProgram("");
                        setDraftIndication("");
                        setDraftPhase(PHASES[1]);
                        setDraftAuths([]);
                        setSelectedProjectId(null);
                      }
                    }}
                    options={[
                      { value: "", label: "None — no program" },
                      ...projects.map(p => ({ value: p.id, label: p.name })),
                    ]}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 text-gs-blue font-semibold text-sm text-left"
                  >
                    <span>{program || "Select program…"}</span>
                    <ChevronDown size={15} />
                  </button>
                  {program && (
                    <button
                      onClick={clearProgram}
                      className="p-1 rounded hover:bg-gs-bg text-gs-muted hover:text-red-500 transition-colors"
                      title="Remove program"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
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
                  <div className="mt-1">
                    <FilterDropdown
                      fullWidth
                      value={draftPhase}
                      onChange={setDraftPhase}
                      options={PHASES.map(p => ({ value: p, label: p }))}
                    />
                  </div>
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
                  {allAuthorities.map((auth, i) => (
                    <button
                      key={auth.name}
                      onClick={() => toggleAuthority(i)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
                        draftAuths.includes(i)
                          ? "bg-gs-blue/10 border-gs-blue text-gs-blue"
                          : "bg-gs-bg border-gs-border text-gs-muted"
                      }`}
                    >
                      {AUTHORITY_COUNTRY_CODE[auth.name] && (
                        <FlagIcon code={AUTHORITY_COUNTRY_CODE[auth.name]} size={14} alt={auth.name} className="mr-1" />
                      )}
                      {auth.name}
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
                      {AUTHORITY_COUNTRY_CODE[auth.name] && (
                        <FlagIcon code={AUTHORITY_COUNTRY_CODE[auth.name]} size={14} alt={auth.name} />
                      )}
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
        )}
      </div>

      {/* ── Save panel — shown whenever there is an active chat and not dismissed ── */}
      {!!activeChatId && !savePanelDismissed && (
        <SavePanel
          activeChatId={activeChatId}
          chatMode={chatMode}
          currentProgramId={selectedProjectId}
          currentProgramName={program}
          projects={projects}
          onSaved={(project) => {
            if (project) {
              // Add newly created project to local list if not already present
              setProjects(prev => prev.some(p => p.id === project.id) ? prev : [...prev, project]);
              applyProject(project, [...projects, project]);
            }
          }}
          onMarkedTemporary={onTemporaryMarked}
          onDismiss={() => setSavePanelDismissed(true)}
        />
      )}

      {/* ── Recent Chats — General Mode only ── */}
      {chatMode === "general" && (
        <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-semibold text-gs-muted uppercase tracking-wider">
              Recent Chats
            </h2>
            <Link href="/dashboard/history" className="text-gs-blue text-[11px] font-semibold hover:underline">View all</Link>
          </div>
          {recentChats.length === 0 ? (
            <p className="text-[12px] text-gs-muted leading-relaxed">
              No recent chats yet. Start a conversation to see your history here.
            </p>
          ) : (
            <div className="space-y-0.5">
              {recentChats.map(chat => (
                <ChatHistoryRow
                  key={chat.id}
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  onSelect={() => onChatSelect(chat.id)}
                  onDelete={onDeleteChat ? () => onDeleteChat(chat.id) : undefined}
                  deleteDisabled={actionsDisabled}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Key Insights — Program Mode with program only ── */}
      {chatMode === "program" && hasProgram && (
        <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gs-muted uppercase tracking-wider">
              Key Insights
            </h2>
            {insightCounts && (
              <span className="text-[10px] font-semibold text-gs-green bg-gs-green/10 px-2 py-0.5 rounded-full">
                From analysis
              </span>
            )}
          </div>
          <p className="text-[11px] text-gs-muted mb-3">Click any insight to ask about it</p>
          <div>
            {INSIGHT_DEFINITIONS.map(({ icon: Icon, key, label, color, query }) => {
              const count = insightCounts?.[key];
              return (
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
                  <span className={`text-base font-bold ${count != null ? "text-gs-text" : "text-gs-muted/40"}`}>
                    {count != null ? count : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Suggested Prompts ── */}
      <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card">
        <h2 className="text-xs font-semibold text-gs-muted uppercase tracking-wider mb-4">
          Suggested Prompts
        </h2>
        <div className="space-y-2.5">
          {suggestedPrompts.map((text: string) => (
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

      {/* ── Recent Chats — Program Mode only ── */}
      {chatMode === "program" && (
        <div className="bg-gs-card p-5 rounded-card border border-gs-border shadow-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-semibold text-gs-muted uppercase tracking-wider">
              Recent Chats
            </h2>
            <Link href="/dashboard/history" className="text-gs-blue text-[11px] font-semibold hover:underline">View all</Link>
          </div>
          {recentChats.length === 0 ? (
            <p className="text-[12px] text-gs-muted leading-relaxed">
              No recent chats yet. Start a conversation to see your history here.
            </p>
          ) : (
            <div className="space-y-0.5">
              {recentChats.map(chat => (
                <ChatHistoryRow
                  key={chat.id}
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  onSelect={() => onChatSelect(chat.id)}
                  onDelete={onDeleteChat ? () => onDeleteChat(chat.id) : undefined}
                  deleteDisabled={actionsDisabled}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
