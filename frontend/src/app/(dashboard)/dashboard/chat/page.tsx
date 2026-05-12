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
import { chatApi, organizationApi } from "../../../../lib/api";
import { DEFAULT_CHAT_MODEL, isChatModelId } from "../../../../lib/chatModels";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";

function RegulatoryChatPage() {
  const searchParams = useSearchParams();
  const [conversationId, setConversationId]     = useState<string | null>(searchParams.get("conversation"));
  const [input, setInput]                       = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId]     = useState<string | null>(null);
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(searchParams.get("projectId"));
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [isOrgOwner, setIsOrgOwner] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolled       = useRef(false);

  const { conversations, isStreaming, streamingContent, updateConversation, removeConversation } = useChatStore();
  const user = useChatStore((s) => s.user);
  const { loadConversations, sendAll } = useChat();

  useEffect(() => {
    loadConversations().catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.organization_id) {
      setIsOrgOwner(false);
      return;
    }
    organizationApi.get()
      .then((org) => setIsOrgOwner(org.owner_id === user.id))
      .catch(() => setIsOrgOwner(false));
  }, [user?.id, user?.organization_id]);

  // When a specific conversation is requested via URL, always fetch it from the API
  // so we get fresh data with full messages. Only skip if it's already in the store
  // with messages loaded (avoids redundant fetches on sidebar clicks after initial load).
  useEffect(() => {
    if (!conversationId) return;
    const already = useChatStore.getState().conversations.find(c => c.id === conversationId);
    if (already && (already.messages?.length ?? 0) > 0) return;
    chatApi.getConversation(conversationId)
      .then(c => {
        const inStore = useChatStore.getState().conversations.find(x => x.id === c.id);
        if (inStore) updateConversation(c.id, c);
        else useChatStore.getState().addConversation(c);
      })
      .catch(console.error);
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isStreaming) userScrolled.current = false;
  }, [isStreaming]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    userScrolled.current = el.scrollHeight - el.scrollTop - el.clientHeight >= 100;
  }, []);

  // ── Messages ────────────────────────────────────────────────────────────────

  const currentConversation = conversations.find(c => c.id === conversationId);

  useEffect(() => {
    if (!currentConversation?.model) return;
    setSelectedModel(isChatModelId(currentConversation.model) ? currentConversation.model : DEFAULT_CHAT_MODEL);
  }, [currentConversation?.model]);

  // Sync sidebar project context from loaded conversation (e.g. opened via ?conversation=id)
  useEffect(() => {
    if (currentConversation?.project_id && !selectedProjectId) {
      setSelectedProjectId(currentConversation.project_id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversation?.project_id]);

  const stableMessages = useMemo<DisplayMessage[]>(() => {
    return (currentConversation?.messages ?? []).map(msg => ({
      id:               msg.id,
      role:             msg.role as "user" | "assistant",
      content:          msg.content,
      timestamp:        new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isAnalysis:       msg.is_analysis ?? false,
      analysisData:     msg.is_analysis && msg.analysis_data
        ? (msg.analysis_data as Record<string, AnalysisAuthority>)
        : undefined,
      attachedFilename: msg.attached_filename ?? null,
      attachedUrl:      msg.attached_url ?? null,
    }));
  }, [currentConversation?.messages]);

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

  // Scroll to bottom on every new message (optimistic or streamed) unless user scrolled up
  useEffect(() => {
    if (userScrolled.current) return;
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [stableMessages.length, streamingContent, conversationId]);

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
      model:       selectedModel,
      projectId:   !conversationId ? selectedProjectId ?? undefined : undefined,
      onConversationReady: !conversationId ? setConversationId : undefined,
    });
    if (resolvedId && !conversationId) setConversationId(resolvedId);
  }, [input, isStreaming, conversationId, selectedAuthorities, selectedModel, selectedProjectId, sendAll]);

  const handleFileUpload = useCallback(async (file: File, text?: string) => {
    userScrolled.current = false;
    const resolvedId = await sendAll({
      conversationId,
      message:     text,
      file,
      authorities: selectedAuthorities.length > 0 ? selectedAuthorities : undefined,
      model:       selectedModel,
      projectId:   !conversationId ? selectedProjectId ?? undefined : undefined,
      onConversationReady: !conversationId ? setConversationId : undefined,
    });
    if (resolvedId && !conversationId) setConversationId(resolvedId);
  }, [conversationId, selectedAuthorities, selectedModel, selectedProjectId, sendAll]);

  const handleAuthoritiesChange = useCallback(async (authorities: string[]) => {
    setSelectedAuthorities(authorities);
    if (conversationId) {
      await chatApi.updateAuthorities(conversationId, authorities).catch(console.error);
    }
  }, [conversationId]);

  const handleProjectChange = useCallback((projectId: string | null) => {
    setSelectedProjectId(projectId);
    if (conversationId) {
      updateConversation(conversationId, { project_id: projectId });
    }
  }, [conversationId, updateConversation]);

  const handleModelChange = useCallback((model: string) => {
    if (!isChatModelId(model)) return;
    setSelectedModel(model);
    if (conversationId) {
      updateConversation(conversationId, { model });
      chatApi.updateConversation(conversationId, { model }).catch(console.error);
    }
  }, [conversationId, updateConversation]);

  const handleChatSelect = useCallback((chatId: string) => {
    setConversationId(chatId);
    setInput("");
    userScrolled.current = false;
  }, []);

  const handleNewChat = useCallback(() => {
    setConversationId(null);
    setInput("");
    setSelectedModel(DEFAULT_CHAT_MODEL);
  }, []);

  const handleDeleteChat = useCallback((chatId?: string) => {
    const idToDelete = chatId ?? conversationId;
    if (!idToDelete) return;
    setDeleteConfirmId(idToDelete);
  }, [conversationId]);

  const confirmDeleteChat = useCallback(async () => {
    if (!deleteConfirmId) return;
    try {
      await chatApi.deleteConversation(deleteConfirmId);
      removeConversation(deleteConfirmId);
      if (deleteConfirmId === conversationId) { setConversationId(null); setInput(""); }
    } catch { /* silently fail */ }
    setDeleteConfirmId(null);
  }, [deleteConfirmId, conversationId, removeConversation]);

  // ── Sidebar data ─────────────────────────────────────────────────────────────

  const recentChats: RecentChatItem[] = conversations.slice(0, 10).map(c => ({
    id:    c.id,
    title: c.title ?? "New conversation",
    date:  new Date(c.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    canDelete: c.user_id === user?.id || isOrgOwner,
  }));

  const isLoading = isStreaming && !streamingContent;
  const canDeleteActiveChat = !!currentConversation && (currentConversation.user_id === user?.id || isOrgOwner);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4">
        <ChatHeader
          onNewChat={handleNewChat}
          onToggleSidebar={() => setMobileSidebarOpen(o => !o)}
          onDeleteChat={() => handleDeleteChat()}
          hasActiveChat={canDeleteActiveChat}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          modelDisabled={isStreaming}
        />
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
            initialProjectId={selectedProjectId ?? undefined}
            onProjectChange={handleProjectChange}
            onDeleteChat={(id) => handleDeleteChat(id)}
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
              initialProjectId={selectedProjectId ?? undefined}
              onProjectChange={handleProjectChange}
              onDeleteChat={(id) => handleDeleteChat(id)}
            />
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <ConfirmModal
          title="Delete Chat"
          message="This will permanently delete this conversation and all its messages. This action cannot be undone."
          confirmLabel="Delete Chat"
          onCancel={() => setDeleteConfirmId(null)}
          onConfirm={confirmDeleteChat}
        />
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
