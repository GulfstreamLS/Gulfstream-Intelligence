"use client";

import Image from "next/image";
import { useState, useEffect, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  ExternalLink, User, Check, Download, X,
  Sparkles, Scale, FlaskConical, Globe, BarChart2, FileText,
  AlertTriangle, Lightbulb, ShieldAlert, Zap, TrendingUp, BookOpen,
  FileDown, Monitor, Bell,
} from "lucide-react";
import type { DisplayMessage, AnalysisAuthority } from "../../types/chat";
import { useChatStore } from "../../store/chatStore";

interface ChatMessagesProps {
  messages: DisplayMessage[];
  isLoading?: boolean;
  onSendMessage?: (text: string) => void;
  hideEmptyState?: boolean;
}

const STARTER_CARDS = [
  {
    icon: Scale,
    color: "bg-blue-50 dark:bg-gs-blue/10 text-gs-blue",
    title: "Compare jurisdictions",
    example: "Compare EMA vs FDA requirements for gene therapy",
  },
  {
    icon: FlaskConical,
    color: "bg-purple-50 dark:bg-purple-900/20 text-gs-purple",
    title: "Non-clinical expectations",
    example: "What are the non-clinical expectations for ATMPs?",
  },
  {
    icon: Globe,
    color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    title: "Health authority guidance",
    example: "What are the Health Canada requirements for CGT products?",
  },
  {
    icon: Sparkles,
    color: "bg-orange-50 dark:bg-orange-900/20 text-gs-orange",
    title: "CMC requirements",
    example: "What are the key CMC requirements for viral vector products?",
  },
];

function EmptyState({ onSendMessage }: { onSendMessage?: (text: string) => void }) {
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
            Ask anything about global regulatory requirements, guidance documents, or strategic advice for your program.
          </p>
        </div>
      </div>

      {/* Starter cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {STARTER_CARDS.map(({ icon: Icon, color, title, example }) => (
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

const SEVERITY_STYLES: Record<string, string> = {
  Critical: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",
  High:     "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400",
  Medium:   "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400",
  Low:      "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",
};

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  High:     "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Medium:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Low:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

function AnalysisCard({ data }: { data: Record<string, AnalysisAuthority> }) {
  const authorities = Object.entries(data);

  return (
    <div className="space-y-6 mt-4">
      {authorities.map(([authority, info]) => (
        <div key={authority} className="space-y-4">
          {/* Authority header + confidence */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-gs-blue/10 border border-gs-blue/30 rounded-full">
                <span className="text-xs font-bold text-gs-blue">{authority}</span>
              </div>
              <span className="text-xs text-gs-muted font-medium">Analysis Report</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gs-green">
              <TrendingUp size={12} />
              {Math.round(info.confidence_score * 100)}% confidence
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gs-bg rounded-xl p-4 border border-gs-border">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={13} className="text-gs-blue" />
              <span className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Summary</span>
            </div>
            <p className="text-sm text-gs-text leading-relaxed">{info.summary}</p>
          </div>

          {/* Insights */}
          {info.insights?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Lightbulb size={13} className="text-gs-purple" />
                <span className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Key Insights</span>
              </div>
              <div className="grid gap-2">
                {info.insights.map((ins, i) => (
                  <div key={i} className="flex gap-2.5 bg-gs-bg rounded-lg p-3 border border-gs-border">
                    <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-gs-purple">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gs-text leading-relaxed">{ins.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gaps */}
          {info.gaps?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <AlertTriangle size={13} className="text-gs-orange" />
                <span className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">
                  Identified Gaps ({info.gaps.length})
                </span>
              </div>
              <div className="space-y-2.5">
                {info.gaps.map((gap, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${SEVERITY_STYLES[gap.severity] ?? SEVERITY_STYLES.Low}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold leading-snug">{gap.title}</p>
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border border-current opacity-80">
                        {gap.severity}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed opacity-90 mb-2">{gap.description}</p>
                    {gap.regulatory_impact && (
                      <p className="text-[12px] opacity-75 mb-1.5">
                        <span className="font-semibold">Impact: </span>{gap.regulatory_impact}
                      </p>
                    )}
                    {gap.recommended_action && (
                      <p className="text-[12px] opacity-75">
                        <span className="font-semibold">Action: </span>{gap.recommended_action}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {info.risks?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <ShieldAlert size={13} className="text-gs-red" />
                <span className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Risks</span>
              </div>
              <div className="space-y-2">
                {info.risks.map((risk, i) => (
                  <div key={i} className="flex gap-2.5 bg-red-50 dark:bg-red-900/10 rounded-lg p-3 border border-red-100 dark:border-red-900/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-gs-red shrink-0 mt-2" />
                    <p className="text-sm text-gs-text leading-relaxed">{risk}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {info.actions?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Zap size={13} className="text-gs-green" />
                <span className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Recommended Actions</span>
              </div>
              <div className="space-y-2.5">
                {info.actions.map((action, i) => (
                  <div key={i} className="bg-gs-bg rounded-xl border border-gs-border p-4 flex gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gs-green">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gs-text leading-snug">{action.title}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_STYLES[action.priority] ?? PRIORITY_STYLES.Medium}`}>
                          {action.priority}
                        </span>
                      </div>
                      <p className="text-[13px] text-gs-muted leading-relaxed">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source basis */}
          {info.source_basis && (
            <p className="text-[11px] text-gs-muted italic border-t border-gs-border pt-3">
              {info.source_basis}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const AIMessage = ({ msg }: { msg: DisplayMessage }) => {
  const { conversations, activeConversationId } = useChatStore();
  const currentConvo = conversations.find(c => c.id === activeConversationId);
  
  // Aggressive check: show buttons if the message is already marked as analysis,
  // OR if the conversation has any indicators of an uploaded file.
  const hasFiles = !!currentConvo?.uploaded_filename || 
                   !!currentConvo?.active_file_id || 
                   currentConvo?.messages.some(m => !!m.attached_filename);
                   
  const canExport = msg.isAnalysis || msg.isAnalysisPotential || hasFiles;

  const [copied, setCopied]   = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<{ type: "pending" | "error"; text: string } | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExport = async (format: string) => {
    if (!msg.id) return;
    setExporting(format);
    setExportNotice(null);
    try {
      const { chatApi } = await import("../../lib/api");
      const res = await chatApi.exportMessage(msg.id, format);
      if (res.url) {
        window.open(res.url, "_blank");
      }
    } catch (error: unknown) {
      const status = (error as { status?: number }).status;
      if (status === 202 || status === 409) {
        setExportNotice({
          type: "pending",
          text: "Your documents are being prepared. You'll receive a notification when they're ready.",
        });
      } else {
        setExportNotice({
          type: "error",
          text: "Export failed. Please try again in a moment.",
        });
      }
    } finally {
      setExporting(null);
    }
  };

  // const handleShare = () => {
  //   const url = `${window.location.origin}${window.location.pathname}`;
  //   if (navigator.share) {
  //     navigator.share({ title: "Regulatory Chat", text: msg.content, url });
  //   } else {
  //     navigator.clipboard.writeText(url).then(() => {
  //       setShared(true);
  //       setTimeout(() => setShared(false), 2000);
  //     });
  //   }
  // };

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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
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
            }}
          >
            {msg.content}
          </ReactMarkdown>
        </div>

        {/* Rich analysis data card — only on committed (non-typing) analysis messages */}
        {msg.isAnalysis && !msg.isTyping && msg.analysisData && (
          <AnalysisCard data={msg.analysisData} />
        )}

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

            {/* Export status notice — shown below toolbar, auto-dismissible */}
            {exportNotice && (
              <div className={`mt-3 flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm border ${
                exportNotice.type === "pending"
                  ? "bg-blue-50 dark:bg-gs-blue/10 border-blue-200 dark:border-gs-blue/30 text-blue-700 dark:text-blue-300"
                  : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              }`}>
                {exportNotice.type === "pending"
                  ? <Bell size={15} className="shrink-0 mt-0.5 opacity-80" />
                  : <AlertTriangle size={15} className="shrink-0 mt-0.5 opacity-80" />
                }
                <span className="flex-1 leading-snug">{exportNotice.text}</span>
                <button
                  onClick={() => setExportNotice(null)}
                  className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
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

export function ChatMessages({ messages, isLoading, onSendMessage, hideEmptyState }: ChatMessagesProps) {

  const showThinking =
    isLoading &&
    (messages.length === 0 || messages[messages.length - 1]?.role === "user");

  return (
    <div className="space-y-8 py-4 pb-4">
      {messages.length === 0 && !isLoading && !hideEmptyState && <EmptyState onSendMessage={onSendMessage} />}

      {messages.map((msg) =>
        msg.role === "user"
          ? <UserMessage key={msg.id} msg={msg} />
          : <AIMessage   key={msg.id} msg={msg} />
      )}

      {showThinking && <ThinkingBubble />}

    </div>
  );
}
