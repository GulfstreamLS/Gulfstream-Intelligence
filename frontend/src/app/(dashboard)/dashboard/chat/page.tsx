"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChatHeader }   from "../../../../components/regulatory-chat/ChatHeader";
import { ChatMessages } from "../../../../components/regulatory-chat/ChatMessages";
import { ChatInputBar } from "../../../../components/regulatory-chat/ChatInputBar";
import { ChatSidebar }  from "../../../../components/regulatory-chat/ChatSidebar";
import type { RecentChatItem, InsightCounts } from "../../../../components/regulatory-chat/ChatSidebar";
import type { DisplayMessage, AnalysisAuthority } from "../../../../types/chat";
import { useChatStore } from "../../../../store/chatStore";
import { useChat }      from "../../../../hooks/useChat";
import { chatApi, organizationApi, notificationApi } from "../../../../lib/api";
import { DEFAULT_CHAT_MODEL, isChatModelId } from "../../../../lib/chatModels";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";

function RegulatoryChatPage() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const urlConversationId = searchParams.get("conversation");
  const urlProjectId      = searchParams.get("projectId");

  const [conversationId, setConversationId]     = useState<string | null>(urlConversationId);
  const [input, setInput]                       = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId]     = useState<string | null>(null);
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(urlProjectId);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_CHAT_MODEL;
    const saved = localStorage.getItem("chat_model");
    return (saved && isChatModelId(saved)) ? saved : DEFAULT_CHAT_MODEL;
  });
  const [isOrgOwner, setIsOrgOwner] = useState(false);
  // Pre-populate displayMessages from sessionStorage on the very first render so
  // messages.length is never 0 when there's a pending auto-send. This avoids any
  // race between React state updates and Zustand store updates causing EmptyState flash.
  const [pendingDisplayMsg, setPendingDisplayMsg] = useState<DisplayMessage | null>(() => {
    if (typeof window === "undefined") return null;
    const text = sessionStorage.getItem("pendingChatMessage")?.trim();
    if (!text) return null;
    return {
      id: "pending-init",
      role: "user" as const,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  });
  const scrollContainerRef  = useRef<HTMLDivElement>(null);
  const userScrolled        = useRef(false);
  const autoMessageSent     = useRef(false);

  const { conversations, isStreaming, streamingContent, updateConversation, removeConversation } = useChatStore();
  const user = useChatStore((s) => s.user);
  const { loadConversations, sendAll } = useChat();

  useEffect(() => {
    loadConversations().catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync conversationId when URL param changes (client-side navigation from history/projects)
  useEffect(() => {
    if (urlConversationId !== null) setConversationId(urlConversationId);
  }, [urlConversationId]);

  useEffect(() => {
    if (urlProjectId !== null) setSelectedProjectId(urlProjectId);
  }, [urlProjectId]);

  const pendingAutoMessage = useRef<string | null>(null);

  // Remove the pending message from sessionStorage and store it in the ref for sending.
  // pendingDisplayMsg (above) already read the text for display — this just primes the send.
  useLayoutEffect(() => {
    const text = sessionStorage.getItem("pendingChatMessage")?.trim();
    if (!text) return;
    sessionStorage.removeItem("pendingChatMessage");
    pendingAutoMessage.current = text;
  }, []);

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
      isAnalysisPotential: msg.role === "assistant" && (!!currentConversation?.uploaded_filename || !!currentConversation?.active_file_id),
      analysisData:     msg.is_analysis && msg.analysis_data
        ? (msg.analysis_data as Record<string, AnalysisAuthority>)
        : undefined,
      attachedFilename: msg.attached_filename ?? null,
      attachedUrl:      msg.attached_url ?? null,
    }));
  }, [currentConversation?.messages, currentConversation?.uploaded_filename, currentConversation?.active_file_id]);

  // Clear the synthetic pending message once real store messages are present
  useEffect(() => {
    if (stableMessages.length > 0 && pendingDisplayMsg) setPendingDisplayMsg(null);
  }, [stableMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayMessages = useMemo<DisplayMessage[]>(() => {
    // Show the synthetic user bubble until the Zustand optimistic message lands
    const base = stableMessages.length === 0 && pendingDisplayMsg
      ? [pendingDisplayMsg]
      : stableMessages;
    if (isStreaming && streamingContent) {
      return [...base, {
        id: "streaming", role: "assistant" as const,
        content: streamingContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isTyping: true,
      }];
    }
    return base;
  }, [stableMessages, pendingDisplayMsg, isStreaming, streamingContent]);

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

  // Send the pending message once handleSendMessage is stable (store has user loaded)
  useEffect(() => {
    const text = pendingAutoMessage.current;
    if (!text || autoMessageSent.current) return;
    autoMessageSent.current = true;
    pendingAutoMessage.current = null;
    handleSendMessage(text);
  }, [handleSendMessage]);

  const handleFileUpload = useCallback(async (files: File[], text?: string) => {
    userScrolled.current = false;
    const resolvedId = await sendAll({
      conversationId,
      message:     text,
      files,
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
    localStorage.setItem("chat_model", model);
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
    router.replace("/dashboard/chat");
  }, [router]);

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

  // Fetch insights from API (analysis_data doesn't arrive via SSE)
  const [insightCounts, setInsightCounts] = useState<InsightCounts | null>(null);

  const fetchInsights = useCallback(async (id: string) => {
    try {
      const data = await chatApi.getInsights(id);
      const hasAny = data.guidelines > 0 || data.differences > 0 || data.riskAreas > 0 || data.recommendations > 0;
      setInsightCounts(hasAny ? data : null);
    } catch { /* silently ignore */ }
  }, []);

  // Fetch when conversation changes
  useEffect(() => {
    if (!conversationId) { setInsightCounts(null); return; }
    fetchInsights(conversationId);
  }, [conversationId, fetchInsights]);

  // Refetch insights after streaming ends (background analysis may have completed)
  const wasStreamingRef = useRef(false);

  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming) {
      // Fetch insights immediately and again after 8 s to catch background analysis.
      if (conversationId) {
        fetchInsights(conversationId);
        setTimeout(() => fetchInsights(conversationId), 8000);
      }
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, conversationId, fetchInsights]);

  // Poll for EXPORT_READY notifications after streaming ends so insights update
  // when the background PDF/PPT/DOCS export completes (fires up to 12×, every 5 s).
  useEffect(() => {
    if (!conversationId || isStreaming) return;
    let count = 0;
    const id = setInterval(async () => {
      if (++count > 12) { clearInterval(id); return; }
      try {
        const notifs = await notificationApi.list(20);
        const ready = notifs.some(
          n => n.type === "export_ready" && n.resource_id === conversationId && !n.is_read
        );
        if (ready) { fetchInsights(conversationId); clearInterval(id); }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(id);
  }, [conversationId, isStreaming, fetchInsights]);

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
          <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pr-1">
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
            insightCounts={insightCounts}
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
              insightCounts={insightCounts}
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
