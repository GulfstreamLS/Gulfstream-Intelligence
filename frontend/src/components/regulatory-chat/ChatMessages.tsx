"use client";

import Image from "next/image";
import { useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ThumbsUp, ThumbsDown, Copy, Share2,
  ExternalLink, User, Check,
  Sparkles, Scale, FlaskConical, Globe,
} from "lucide-react";
import type { DisplayMessage } from "../../types/chat";

interface ChatMessagesProps {
  messages: DisplayMessage[];
  isLoading?: boolean;
  onSendMessage?: (text: string) => void;
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

function ThinkingBubble() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gs-card border border-gs-border rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
        <Image src="/images/FullLogo_NoBuffer.png" alt="GI" width={22} height={22} className="object-contain" />
      </div>
      <div className="bg-gs-card border border-gs-border px-5 py-4 rounded-2xl rounded-tl-none shadow-card">
        <div className="flex gap-1.5 items-center h-5">
          <span className="w-2 h-2 bg-gs-muted rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gs-muted rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gs-muted rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

const UserMessage = memo(function UserMessage({ msg }: { msg: DisplayMessage }) {
  return (
    <div className="flex justify-end items-start gap-3">
      <div className="bg-gs-blue/10 dark:bg-gs-blue/20 p-4 rounded-2xl rounded-tr-none max-w-[80%] border border-gs-blue/20">
        <p className="text-sm text-gs-text leading-relaxed">{msg.content}</p>
        <span className="text-[10px] text-gs-muted font-medium mt-2 block text-right">
          {msg.timestamp}
        </span>
      </div>
      <div className="w-8 h-8 bg-blue-100 dark:bg-gs-blue/20 rounded-full flex items-center justify-center text-gs-blue shrink-0">
        <User size={16} />
      </div>
    </div>
  );
});

const AIMessage = memo(function AIMessage({ msg }: { msg: DisplayMessage }) {
  const [vote, setVote]       = useState<"up" | "down" | null>(null);
  const [copied, setCopied]   = useState(false);
  const [shared, setShared]   = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    if (navigator.share) {
      navigator.share({ title: "Regulatory Chat", text: msg.content, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      });
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gs-card border border-gs-border rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
        <Image src="/images/FullLogo_NoBuffer.png" alt="GI" width={22} height={22} className="object-contain" />
      </div>

      <div className="bg-gs-card border border-gs-border p-5 md:p-6 rounded-2xl rounded-tl-none shadow-card flex-1 min-w-0">
        <div className="prose-gs text-sm text-gs-muted leading-relaxed">
          {msg.isTyping ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          )}
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
                {/* Thumbs up */}
                <button
                  onClick={() => setVote(v => v === "up" ? null : "up")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    vote === "up"
                      ? "text-gs-blue bg-gs-blue/10"
                      : "hover:text-gs-blue hover:bg-gs-bg"
                  }`}
                  aria-label="Helpful"
                >
                  <ThumbsUp size={14} />
                </button>

                {/* Thumbs down */}
                <button
                  onClick={() => setVote(v => v === "down" ? null : "down")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    vote === "down"
                      ? "text-gs-red bg-gs-red/10"
                      : "hover:text-gs-red hover:bg-gs-bg"
                  }`}
                  aria-label="Not helpful"
                >
                  <ThumbsDown size={14} />
                </button>

                {/* Copy */}
                <button
                  onClick={handleCopy}
                  className={`p-1.5 rounded-lg transition-colors ${
                    copied
                      ? "text-gs-green bg-gs-green/10"
                      : "hover:text-gs-text hover:bg-gs-bg"
                  }`}
                  aria-label={copied ? "Copied!" : "Copy response"}
                  title={copied ? "Copied!" : "Copy response"}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className={`p-1.5 rounded-lg transition-colors ${
                    shared
                      ? "text-gs-green bg-gs-green/10"
                      : "hover:text-gs-text hover:bg-gs-bg"
                  }`}
                  aria-label={shared ? "Link copied!" : "Share"}
                  title={shared ? "Link copied!" : "Share"}
                >
                  {shared ? <Check size={14} /> : <Share2 size={14} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export function ChatMessages({ messages, isLoading, onSendMessage }: ChatMessagesProps) {

  const showThinking =
    isLoading &&
    (messages.length === 0 || messages[messages.length - 1]?.role === "user");

  return (
    <div className="space-y-8 py-4 pb-4">
      {messages.length === 0 && !isLoading && <EmptyState onSendMessage={onSendMessage} />}

      {messages.map((msg) =>
        msg.role === "user"
          ? <UserMessage key={msg.id} msg={msg} />
          : <AIMessage   key={msg.id} msg={msg} />
      )}

      {showThinking && <ThinkingBubble />}

    </div>
  );
}
