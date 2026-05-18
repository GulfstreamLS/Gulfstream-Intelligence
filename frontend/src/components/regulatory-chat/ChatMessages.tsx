"use client";

import React, { useState, useEffect, memo } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  ExternalLink, User, Check, Download, X,
  BarChart2, FileText,
  AlertTriangle, TrendingUp,
  FileDown, Monitor, Bell, Search, MessageSquare, PenLine,
} from "lucide-react";
import type { DisplayMessage } from "../../types/chat";

type ChatMode = "general" | "program";

interface ChatMessagesProps {
  messages: DisplayMessage[];
  isLoading?: boolean;
  onSendMessage?: (text: string) => void;
  hideEmptyState?: boolean;
  chatMode?: ChatMode;
  hasProgram?: boolean;
}


const GENERAL_CARDS = [
  {
    icon: TrendingUp,
    color: "bg-blue-50 dark:bg-gs-blue/10 text-gs-blue",
    title: "Industry updates",
    example: "What are the latest life science and FDA updates?",
  },
  {
    icon: PenLine,
    color: "bg-purple-50 dark:bg-purple-900/20 text-gs-purple",
    title: "Draft content",
    example: "Help me draft an email, post, or summary.",
  },
  {
    icon: Search,
    color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    title: "Research a topic",
    example: "Explain a guidance, company, or trend.",
  },
  {
    icon: FileText,
    color: "bg-orange-50 dark:bg-orange-900/20 text-gs-orange",
    title: "Summarize information",
    example: "Summarize recent news or a topic quickly.",
  },
];

const PROGRAM_CARDS = [
  {
    icon: BarChart2,
    color: "bg-blue-50 dark:bg-gs-blue/10 text-gs-blue",
    title: "Analyze program risk",
    example: "Identify key regulatory and development risks.",
  },
  {
    icon: Search,
    color: "bg-purple-50 dark:bg-purple-900/20 text-gs-purple",
    title: "Find gaps",
    example: "Surface missing information or readiness gaps.",
  },
  {
    icon: MessageSquare,
    color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    title: "Simulate authority feedback",
    example: "Anticipate likely health authority questions.",
  },
  {
    icon: FileText,
    color: "bg-orange-50 dark:bg-orange-900/20 text-gs-orange",
    title: "Create executive summary",
    example: "Summarize program strategy and next steps.",
  },
];

const EMPTY_STATE_CONTENT = {
  general: {
    subtitle: "Ask anything, including regulatory questions, industry updates, writing, research, or general professional support.",
    cards: GENERAL_CARDS,
  },
  programNoProject: {
    subtitle: "Ask about regulatory strategy, industry guidance, health authority expectations, or program-specific work.",
    cards: PROGRAM_CARDS,
  },
  programWithProject: {
    subtitle: "Ask about this program's documents, risks, gaps, health authority strategy, or submission readiness.",
    cards: PROGRAM_CARDS,
  },
};

function EmptyState({
  onSendMessage,
  chatMode = "program",
  hasProgram = false,
}: {
  onSendMessage?: (text: string) => void;
  chatMode?: ChatMode;
  hasProgram?: boolean;
}) {
  const key =
    chatMode === "general"
      ? "general"
      : hasProgram
      ? "programWithProject"
      : "programNoProject";

  const { subtitle, cards } = EMPTY_STATE_CONTENT[key];

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-8">
      {/* Logo mark */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gs-card border border-gs-border flex items-center justify-center shadow-sm">
          <Image src="/images/FullLogo_NoBuffer.png" alt="Gulfstream Intelligence" width={36} height={36} className="object-contain" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gs-text tracking-tight">
            How can I help you today?
          </h2>
          <p className="text-sm text-gs-muted mt-1.5 max-w-sm leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Starter cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {cards.map(({ icon: Icon, color, title, example }) => (
          <button
            key={title}
            onClick={() => onSendMessage?.(example)}
            className="flex items-start gap-3 p-4 bg-gs-card border border-gs-border rounded-xl text-left shadow-sm hover:border-gs-blue hover:shadow-md transition-all group"
          >
            <div className={`p-2 rounded-lg shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gs-text mb-0.5 group-hover:text-gs-blue transition-colors">{title}</p>
              <p className="text-[11px] text-gs-muted leading-snug">{example}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-gs-muted">
        Click a card above or type your question below to get started.
      </p>
    </div>
  );
}

function SourcePill({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gs-card border border-gs-border rounded-full text-xs font-semibold text-gs-blue hover:bg-gs-blue/5 cursor-pointer transition-colors shadow-sm">
      <div className="w-4 h-4 bg-blue-100 dark:bg-gs-blue/20 rounded-full flex items-center justify-center shrink-0">
        <div className="w-1.5 h-1.5 bg-gs-blue rounded-full" />
      </div>
      <span className="truncate max-w-[200px]">{label}</span>
      <ExternalLink size={11} className="shrink-0" />
    </div>
  );
}

const THINKING_MESSAGES = [
  "initiating…",
  "compiling…",
  "analysing…",
  "cross-referencing…",
  "scanning…",
  "mapping…",
  "consulting…",
  "reviewing…",
  "building…",
  "preparing…",
  "processing…",
  "evaluating…",
];

function ThinkingBubble() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % THINKING_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2000);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gs-card border border-gs-border rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
        <Image src="/images/FullLogo_NoBuffer.png" alt="GI" width={22} height={22} className="object-contain" />
      </div>
      <div className="bg-gs-card border border-gs-border px-5 py-4 rounded-2xl rounded-tl-none shadow-card min-w-[220px]">
        <div
          className="flex items-center gap-2 h-5 transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <span className="w-1.5 h-1.5 bg-gs-blue rounded-full animate-pulse shrink-0" />
          <span className="text-xs text-gs-muted font-medium whitespace-nowrap">{THINKING_MESSAGES[idx]}</span>
        </div>
      </div>
    </div>
  );
}

const UserMessage = memo(function UserMessage({ msg }: { msg: DisplayMessage }) {
  const attachedFilename = msg.attachedFilename ?? null;
  const isAttachmentOnly = !msg.content && !!attachedFilename;
  // Split comma-joined filenames into individual chips
  const fileNames = attachedFilename
    ? attachedFilename.split(", ").map(n => n.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex justify-end items-start gap-3">
      <div className="flex flex-col items-end gap-1.5 max-w-[80%]">
        {/* File chips — one per attached file */}
        {fileNames.length > 0 && (
          <div className="flex flex-col gap-1.5 w-full">
            {fileNames.map((name, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 bg-gs-card border border-gs-blue/30 rounded-2xl rounded-tr-none shadow-sm">
                <div className="p-1.5 bg-gs-blue/10 rounded-lg shrink-0">
                  <FileText size={14} className="text-gs-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gs-text leading-tight truncate">{name}</p>
                  <p className="text-[11px] text-gs-muted mt-0.5">Uploaded document</p>
                </div>
                {/* Only show View link on the last file (that's where attachedUrl points) */}
                {i === fileNames.length - 1 && msg.attachedUrl && (
                  <a href={msg.attachedUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-semibold text-gs-blue hover:underline shrink-0">
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text bubble — hidden when no text content */}
        {!isAttachmentOnly && msg.content && (
          <div className="bg-gs-blue/10 dark:bg-gs-blue/20 p-4 rounded-2xl rounded-tr-none border border-gs-blue/20 w-full">
            <p className="text-sm text-gs-text leading-relaxed">{msg.content}</p>
          </div>
        )}

        <span className="text-[10px] text-gs-muted font-medium">{msg.timestamp}</span>
      </div>
      <div className="w-8 h-8 bg-blue-100 dark:bg-gs-blue/20 rounded-full flex items-center justify-center text-gs-blue shrink-0">
        <User size={16} />
      </div>
    </div>
  );
});

// Renders markdown inline — strips the outer <p> so it flows inside existing containers.
// Shared ReactMarkdown components — defined outside the component so the object
// reference is stable and React doesn't remount on every render.
const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  a: ({ href, children }) => {
    const isFile = href && /\.(pptx|pdf|docx|xlsx|zip|csv)(\?.*)?$/i.test(href);
    if (isFile && href) {
      const ext = href.split(".").pop()?.split("?")[0]?.toUpperCase() ?? "FILE";
      const extColors: Record<string, string> = {
        PPTX: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        PDF:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        DOCX: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        XLSX: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      };
      const badgeClass = extColors[ext] ?? "bg-gs-muted/20 text-gs-muted";
      const label = (Array.isArray(children) ? children.join("") : String(children ?? "")).trim() || `Download ${ext}`;
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 mt-3 px-4 py-3 bg-gs-bg border border-gs-border rounded-xl hover:border-gs-blue hover:bg-gs-blue/5 transition-all no-underline group w-fit max-w-full"
        >
          <div className="p-2 bg-gs-card border border-gs-border rounded-lg shrink-0 group-hover:border-gs-blue/30 transition-colors">
            <Download size={16} className="text-gs-blue" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-gs-text truncate max-w-[220px] group-hover:text-gs-blue transition-colors">{label}</span>
            <span className="text-[11px] text-gs-muted">Click to open</span>
          </div>
          <span className={`ml-auto shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${badgeClass}`}>{ext}</span>
          <ExternalLink size={13} className="shrink-0 text-gs-muted group-hover:text-gs-blue transition-colors" />
        </a>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-gs-blue underline hover:opacity-80">
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-gs-border shadow-sm">
      <table className="w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gs-blue/10 dark:bg-gs-blue/15">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-gs-border">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="even:bg-gs-bg/60 transition-colors hover:bg-gs-blue/5">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-[11px] font-bold text-gs-blue uppercase tracking-wider border-b border-gs-border whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-[13px] text-gs-text leading-relaxed align-top">
      {children}
    </td>
  ),
};

const AIMessage = ({
  msg,
}: {
  msg: DisplayMessage;
}) => {
  const canExport = msg.isAnalysis || msg.isAnalysisPotential;

  const [copied, setCopied]   = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportToast, setExportToast] = useState<{ type: "pending" | "error"; text: string } | null>(null);

  // Auto-dismiss toast after 5 s
  useEffect(() => {
    if (!exportToast) return;
    const t = setTimeout(() => setExportToast(null), 5000);
    return () => clearTimeout(t);
  }, [exportToast]);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = async (format: string) => {
    if (!msg.id) return;
    setExporting(format);
    setExportToast(null);
    try {
      const { chatApi } = await import("../../lib/api");
      const res = await chatApi.exportMessage(msg.id, format) as unknown as { url?: string; detail?: string };
      if (res.url) {
        window.open(res.url, "_blank");
      } else if (res.detail) {
        setExportToast({ type: "pending", text: res.detail });
      }
    } catch {
      setExportToast({ type: "error", text: "Export failed. Please try again in a moment." });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gs-card border border-gs-border rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
        <Image src="/images/FullLogo_NoBuffer.png" alt="GI" width={22} height={22} className="object-contain" />
      </div>

      <div className="bg-gs-card border border-gs-border p-5 md:p-6 rounded-2xl rounded-tl-none shadow-card flex-1 min-w-0">
        {/* Analysis header badge */}
        {msg.isAnalysis && (
          <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1 bg-gs-blue/10 rounded-lg w-fit">
            <BarChart2 size={12} className="text-gs-blue" />
            <span className="text-[11px] font-semibold text-gs-blue">Regulatory Analysis</span>
          </div>
        )}

        <div className="prose-gs text-sm text-gs-muted leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
            {msg.content}
          </ReactMarkdown>
        </div>

        {!msg.isTyping && (
          <>
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gs-border space-y-2">
                <p className="text-[11px] font-semibold text-gs-muted uppercase tracking-widest">Sources</p>
                <div className="flex flex-wrap gap-2">
                  {msg.sources.map((s) => <SourcePill key={s} label={s} />)}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gs-border">
              <span className="text-[10px] text-gs-muted font-medium uppercase tracking-widest">
                {msg.timestamp}
              </span>

              <div className="flex gap-1 text-gs-muted">
                {/* <button
                  onClick={() => setVote(v => v === "up" ? null : "up")}
                  className={`p-1.5 rounded-lg transition-colors ${vote === "up" ? "text-gs-blue bg-gs-blue/10" : "hover:text-gs-blue hover:bg-gs-bg"}`}
                  aria-label="Helpful"
                >
                  <ThumbsUp size={14} />
                </button>

                <button
                  onClick={() => setVote(v => v === "down" ? null : "down")}
                  className={`p-1.5 rounded-lg transition-colors ${vote === "down" ? "text-gs-red bg-gs-red/10" : "hover:text-gs-red hover:bg-gs-bg"}`}
                  aria-label="Not helpful"
                >
                  <ThumbsDown size={14} />
                </button> */}

                <button
                  onClick={handleCopy}
                  className={`p-1.5 rounded-lg transition-colors ${copied ? "text-gs-green bg-gs-green/10" : "hover:text-gs-text hover:bg-gs-bg"}`}
                  aria-label={copied ? "Copied!" : "Copy response"}
                  title={copied ? "Copied!" : "Copy response"}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>

                {canExport && (
                  <>
                    <button
                      onClick={() => handleExport("pdf")}
                      disabled={!!exporting}
                      className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${exporting === "pdf" ? "text-gs-blue bg-gs-blue/10 animate-pulse" : "hover:text-gs-blue hover:bg-gs-bg text-gs-muted"}`}
                      title="Download PDF Analysis"
                    >
                      <FileDown size={14} />
                      <span className="text-[9px] font-bold tracking-tighter">PDF</span>
                    </button>

                    <button
                      onClick={() => handleExport("word")}
                      disabled={!!exporting}
                      className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${exporting === "word" ? "text-gs-blue bg-gs-blue/10 animate-pulse" : "hover:text-gs-blue hover:bg-gs-bg text-gs-muted"}`}
                      title="Download DOCS Analysis"
                    >
                      <FileText size={14} />
                      <span className="text-[9px] font-bold tracking-tighter">DOCS</span>
                    </button>

                    <button
                      onClick={() => handleExport("ppt")}
                      disabled={!!exporting}
                      className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${exporting === "ppt" ? "text-gs-orange bg-gs-orange/10 animate-pulse" : "hover:text-gs-orange hover:bg-gs-bg text-gs-muted"}`}
                      title="Download PPT Analysis"
                    >
                      <Monitor size={14} />
                      <span className="text-[9px] font-bold tracking-tighter">PPT</span>
                    </button>
                  </>
                )}

                {/* <button
                  onClick={handleShare}
                  className={`p-1.5 rounded-lg transition-colors ${shared ? "text-gs-green bg-gs-green/10" : "hover:text-gs-text hover:bg-gs-bg"}`}
                  aria-label={shared ? "Link copied!" : "Share"}
                  title={shared ? "Link copied!" : "Share"}
                >
                  {shared ? <Check size={14} /> : <Share2 size={14} />}
                </button> */}

                {/* Download response as markdown */}
                <button
                  onClick={() => {
                    const blob = new Blob([msg.content], { type: "text/markdown;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${msg.isAnalysis ? "analysis" : "response"}-${Date.now()}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="p-1.5 rounded-lg transition-colors hover:text-gs-text hover:bg-gs-bg"
                  aria-label="Download as markdown"
                  title="Download as .md"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>

            {/* Export toast — fixed bottom-right, auto-dismisses after 5 s */}
            {exportToast && (
              <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl border max-w-sm w-full text-sm transition-all ${
                exportToast.type === "pending"
                  ? "bg-gs-card border-gs-blue/30 text-gs-text"
                  : "bg-gs-card border-red-300 dark:border-red-700 text-gs-text"
              }`}>
                <div className={`shrink-0 p-1.5 rounded-lg ${
                  exportToast.type === "pending" ? "bg-gs-blue/10" : "bg-red-100 dark:bg-red-900/30"
                }`}>
                  {exportToast.type === "pending"
                    ? <Bell size={15} className="text-gs-blue" />
                    : <AlertTriangle size={15} className="text-red-500" />
                  }
                </div>
                <span className="flex-1 leading-snug">{exportToast.text}</span>
                <button
                  onClick={() => setExportToast(null)}
                  className="shrink-0 text-gs-muted hover:text-gs-text transition-colors mt-0.5"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export function ChatMessages({
  messages, isLoading, onSendMessage, hideEmptyState,
  chatMode, hasProgram,
}: ChatMessagesProps) {

  const showThinking =
    isLoading &&
    (messages.length === 0 || messages[messages.length - 1]?.role === "user");

  return (
    <div className="space-y-8 py-4 pb-4">
      {messages.length === 0 && !isLoading && !hideEmptyState && (
        <EmptyState onSendMessage={onSendMessage} chatMode={chatMode} hasProgram={hasProgram} />
      )}

      {messages.map((msg) =>
        msg.role === "user"
          ? <UserMessage key={msg.id} msg={msg} />
          : <AIMessage key={msg.id} msg={msg} />
      )}

      {showThinking && <ThinkingBubble />}

    </div>
  );
}
