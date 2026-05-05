"use client";

import { Suspense } from "react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ChatHeader }   from "../../../../components/regulatory-chat/ChatHeader";
import { ChatMessages } from "../../../../components/regulatory-chat/ChatMessages";
import { ChatInputBar } from "../../../../components/regulatory-chat/ChatInputBar";
import { ChatSidebar }  from "../../../../components/regulatory-chat/ChatSidebar";
import type { RecentChatItem } from "../../../../components/regulatory-chat/ChatSidebar";
import type { DisplayMessage, AnalysisAuthority } from "../../../../types/chat";
import { useChatStore } from "../../../../store/chatStore";
import { useChat }      from "../../../../hooks/useChat";
import { chatApi }      from "../../../../lib/api";

function RegulatoryChatPage() {
  const searchParams = useSearchParams();
  const [conversationId, setConversationId]     = useState<string | null>(searchParams.get("conversation"));
  const [input, setInput]                       = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolled       = useRef(false);

  const { conversations, isStreaming, streamingContent } = useChatStore();
  const { loadConversations, sendAll } = useChat();

  useEffect(() => {
    loadConversations().catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isStreaming) userScrolled.current = false;
  }, [isStreaming]);

  useEffect(() => {
    if (userScrolled.current) return;
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [streamingContent, conversationId]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    userScrolled.current = el.scrollHeight - el.scrollTop - el.clientHeight >= 100;
  }, []);

  // ── Messages ────────────────────────────────────────────────────────────────

  const currentConversation = conversations.find(c => c.id === conversationId);

  const stableMessages = useMemo<DisplayMessage[]>(
    () => (currentConversation?.messages ?? []).map(msg => ({
      id:           msg.id,
      role:         msg.role as "user" | "assistant",
      content:      msg.content,
      timestamp:    new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isAnalysis:   msg.is_analysis ?? false,
      analysisData: msg.is_analysis && msg.analysis_data
        ? (msg.analysis_data as Record<string, AnalysisAuthority>)
        : undefined,
    })),
    [currentConversation?.messages],
  );

  const displayMessages = useMemo<DisplayMessage[]>(() => {
    if (isStreaming && streamingContent) {
      return [...stableMessages, {
        id: "streaming", role: "assistant" as const,
        content: streamingContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isTyping: true,
      }];
    }
    return stableMessages;
  }, [stableMessages, isStreaming, streamingContent]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isStreaming) return;
    if (!textOverride) setInput("");
    userScrolled.current = false;

    const resolvedId = await sendAll({
      conversationId,
      message:     text,
      authorities: selectedAuthorities.length > 0 ? selectedAuthorities : undefined,
    });
    if (resolvedId && !conversationId) setConversationId(resolvedId);
  }, [input, isStreaming, conversationId, selectedAuthorities, sendAll]);

  const handleFileUpload = useCallback(async (file: File, text?: string) => {
    userScrolled.current = false;
    const resolvedId = await sendAll({
      conversationId,
      message:     text,
      file,
      authorities: selectedAuthorities.length > 0 ? selectedAuthorities : undefined,
    });
    if (resolvedId && !conversationId) setConversationId(resolvedId);
  }, [conversationId, selectedAuthorities, sendAll]);

  const handleAuthoritiesChange = useCallback(async (authorities: string[]) => {
    setSelectedAuthorities(authorities);
    if (conversationId) {
      await chatApi.updateAuthorities(conversationId, authorities).catch(console.error);
    }
  }, [conversationId]);

  const handleChatSelect = useCallback((chatId: string) => {
    setConversationId(chatId);
    setInput("");
    userScrolled.current = false;
  }, []);

  const handleNewChat = useCallback(() => {
    setConversationId(null);
    setInput("");
  }, []);

  // ── Sidebar data ─────────────────────────────────────────────────────────────

  const recentChats: RecentChatItem[] = conversations.slice(0, 10).map(c => ({
    id:    c.id,
    title: c.title ?? "New conversation",
    date:  new Date(c.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const isLoading = isStreaming && !streamingContent;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4">
        <ChatHeader onNewChat={handleNewChat} onToggleSidebar={() => setMobileSidebarOpen(o => !o)} />
      </div>

      <div className="flex flex-1 gap-6 min-h-0 px-4 md:px-6 lg:px-8">
        {/* Chat column */}
        <div className="flex flex-col flex-1 min-h-0">
          <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto scrollbar-hide pr-1">
            <ChatMessages messages={displayMessages} isLoading={isLoading} onSendMessage={handleSendMessage} />
          </div>
          <ChatInputBar
            value={input}
            onChange={setInput}
            onSend={() => handleSendMessage()}
            onFileUpload={handleFileUpload}
            disabled={isStreaming}
          />
        </div>

        {/* Right sidebar — desktop */}
        <div className="hidden lg:flex flex-col w-[360px] shrink-0 overflow-y-auto scrollbar-hide pb-4 gap-4">
          <ChatSidebar
            onSendMessage={handleSendMessage}
            activeChatId={conversationId ?? undefined}
            onChatSelect={handleChatSelect}
            recentChats={recentChats}
            onAuthoritiesChange={handleAuthoritiesChange}
          />
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative ml-auto w-[320px] sm:w-[360px] h-full bg-gs-bg overflow-y-auto scrollbar-hide flex flex-col gap-4 p-4 shadow-2xl">
            <ChatSidebar
              onSendMessage={t => { handleSendMessage(t); setMobileSidebarOpen(false); }}
              activeChatId={conversationId ?? undefined}
              onChatSelect={id => { handleChatSelect(id); setMobileSidebarOpen(false); }}
              recentChats={recentChats}
              onAuthoritiesChange={handleAuthoritiesChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <RegulatoryChatPage />
    </Suspense>
  );
}
