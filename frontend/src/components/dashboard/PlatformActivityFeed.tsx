"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare, History } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useChat } from "../../hooks/useChat";

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return "Just now";
}

export function PlatformActivityFeed() {
  const { conversations } = useChatStore();
  const { loadConversations } = useChat();

  useEffect(() => {
    loadConversations().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recent = [...conversations]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium tracking-wide uppercase text-gs-muted">
        Platform Activity
      </p>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <History className="w-8 h-8 text-gs-border" />
          <p className="text-[13px] font-medium text-gs-muted">No activity yet.</p>
          <Link href="/dashboard/chat" className="text-[13px] font-bold text-gs-blue hover:underline">
            Start a conversation
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {recent.map((convo) => {
              const title = convo.title ?? convo.messages?.find((m) => m.role === "user")?.content?.slice(0, 80) ?? "New conversation";
              return (
                <Link
                  key={convo.id}
                  href={`/dashboard/chat?conversation=${convo.id}`}
                  className="flex items-start gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gs-text truncate">{title}</p>
                    <p className="text-xs text-gs-muted truncate">{convo.project_name ?? "Regulatory Chat"}</p>
                  </div>
                  <span className="text-xs text-gs-muted shrink-0">{timeAgo(convo.updated_at)}</span>
                </Link>
              );
            })}
          </div>

          <Link
            href="/dashboard/history"
            className="flex items-center gap-1 text-sm font-medium text-gs-blue hover:text-gs-deep-blue transition-colors mt-1"
          >
            View all activity
            <ArrowRight className="w-4 h-4" />
          </Link>
        </>
      )}
    </div>
  );
}
