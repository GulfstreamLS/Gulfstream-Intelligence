"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ChatHeader }   from "../../../../components/regulatory-chat/ChatHeader";
import { ChatMessages } from "../../../../components/regulatory-chat/ChatMessages";
import { ChatInputBar } from "../../../../components/regulatory-chat/ChatInputBar";
import { ChatSidebar }  from "../../../../components/regulatory-chat/ChatSidebar";
import type { RecentChatItem } from "../../../../components/regulatory-chat/ChatSidebar";
import type { DisplayMessage } from "../../../../types/chat";
import { useChatStore } from "../../../../store/chatStore";
import { useChat } from "../../../../hooks/useChat";

export default function RegulatoryChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput]                   = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolled       = useRef(false);

  const { conversations, isStreaming, streamingContent } = useChatStore();
  const { loadConversations, startNewConversation, sendMessage } = useChat();

  // Load conversation list on mount
  useEffect(() => {
    loadConversations().catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset scroll lock whenever streaming begins (new message)
  useEffect(() => {
    if (isStreaming) userScrolled.current = false;
  }, [isStreaming]);

  // Auto-scroll while streaming unless user has scrolled up
  useEffect(() => {
    if (userScrolled.current) return;
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [streamingContent, conversationId]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    userScrolled.current = !atBottom;
  }, []);

  // Build DisplayMessage[] from store messages + live streaming bubble
  const currentConversation = conversations.find(c => c.id === conversationId);

  const stableMessages = useMemo<DisplayMessage[]>(
    () => (currentConversation?.messages ?? []).map(msg => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })),
    [currentConversation?.messages],
  );

  const displayMessages = useMemo<DisplayMessage[]>(() => {
    if (isStreaming && streamingContent) {
      return [
        ...stableMessages,
        {
          id: "streaming",
          role: "assistant" as const,
          content: streamingContent,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isTyping: true,
        },
      ];
    }
    return stableMessages;
  }, [stableMessages, isStreaming, streamingContent]);

  const handleSendMessage = useCallback(async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isStreaming) return;
    if (!textOverride) setInput("");

    let convId = conversationId;
    if (!convId) {
      const convo = await startNewConversation();
      convId = convo.id;
      setConversationId(convId);
    }

    userScrolled.current = false;
    await sendMessage(convId, text);
  }, [input, isStreaming, conversationId, startNewConversation, sendMessage]);

  const handleChatSelect = useCallback((chatId: string) => {
    setConversationId(chatId);
    setInput("");
    userScrolled.current = false;
  }, []);

  const handleNewChat = useCallback(() => {
    setConversationId(null);
    setInput("");
  }, []);

  // Sidebar: real conversation list from store
  const recentChats: RecentChatItem[] = conversations.slice(0, 10).map(c => ({
    id: c.id,
    title: c.title ?? "New conversation",
    date: new Date(c.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  // Show thinking bubble only while waiting for the first streaming token
  const isLoading = isStreaming && !streamingContent;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4">
        <ChatHeader
          onNewChat={handleNewChat}
          onToggleSidebar={() => setMobileSidebarOpen(o => !o)}
        />
      </div>

      <div className="flex flex-1 gap-6 min-h-0 px-4 md:px-6 lg:px-8">
        {/* Chat column */}
        <div className="flex flex-col flex-1 min-h-0">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto scrollbar-hide pr-1"
          >
            <ChatMessages
              messages={displayMessages}
              isLoading={isLoading}
              onSendMessage={(text) => handleSendMessage(text)}
            />
          </div>
          <ChatInputBar
            value={input}
            onChange={setInput}
            onSend={() => handleSendMessage()}
            disabled={isStreaming}
          />
        </div>

        {/* Right sidebar — desktop only */}
        <div className="hidden lg:flex flex-col w-[360px] shrink-0 overflow-y-auto scrollbar-hide pb-4 gap-4">
          <ChatSidebar
            onSendMessage={(text) => handleSendMessage(text)}
            activeChatId={conversationId ?? undefined}
            onChatSelect={handleChatSelect}
            recentChats={recentChats}
          />
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative ml-auto w-[320px] sm:w-[360px] h-full bg-gs-bg overflow-y-auto scrollbar-hide flex flex-col gap-4 p-4 shadow-2xl">
            <ChatSidebar
              onSendMessage={(text) => { handleSendMessage(text); setMobileSidebarOpen(false); }}
              activeChatId={conversationId ?? undefined}
              onChatSelect={(id) => { handleChatSelect(id); setMobileSidebarOpen(false); }}
              recentChats={recentChats}
            />
          </div>
        </div>
      )}
    </div>
  );
}
