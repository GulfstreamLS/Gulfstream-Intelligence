"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChatHeader }     from "../../../../components/regulatory-chat/ChatHeader";
import type { ChatMode }  from "../../../../components/regulatory-chat/ChatHeader";
import { ChatMessages }   from "../../../../components/regulatory-chat/ChatMessages";
import { ChatInputBar }   from "../../../../components/regulatory-chat/ChatInputBar";
import { ChatSidebar }    from "../../../../components/regulatory-chat/ChatSidebar";
import { ChatScrollbar }  from "../../../../components/regulatory-chat/ChatScrollbar";
import type { RecentChatItem, InsightCounts } from "../../../../components/regulatory-chat/ChatSidebar";
import type { DisplayMessage, AnalysisAuthority } from "../../../../types/chat";
import { useChatStore } from "../../../../store/chatStore";
import { useChat }      from "../../../../hooks/useChat";
import { chatApi, organizationApi } from "../../../../lib/api";
import { DEFAULT_CHAT_MODEL, isChatModelId } from "../../../../lib/chatModels";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";

const ACTIVE_CONVERSATION_STORAGE_KEY = "chat_conversation_id";
const CHAT_PROJECT_STORAGE_KEY = "chat_project_id";
const CHAT_MODE_STORAGE_KEY = "chat_mode";
const CHAT_MODEL_STORAGE_KEY = "chat_model";

function saveActiveConversationId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_CONVERSATION_STORAGE_KEY, id);
  else localStorage.removeItem(ACTIVE_CONVERSATION_STORAGE_KEY);
}

function RegulatoryChatPage() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const urlConversationId = searchParams.get("conversation");
  const urlProjectId      = searchParams.get("projectId");
  const restoredConversationId = urlConversationId ?? (urlProjectId ? null : useChatStore.getState().activeConversationId);

  const [conversationId, setConversationId]     = useState<string | null>(restoredConversationId);
  const [input, setInput]                       = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId]     = useState<string | null>(null);
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(urlProjectId);
  const [chatMode, setChatMode] = useState<ChatMode>("program");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [isOrgOwner, setIsOrgOwner] = useState(false);
  const [pendingDisplayMsg, setPendingDisplayMsg] = useState<DisplayMessage | null>(null);
  const scrollContainerRef  = useRef<HTMLDivElement>(null);
  const userScrolled        = useRef(false);
  const autoMessageSent     = useRef(false);
  const isNewConversationRef = useRef(false);

  const { conversations, isStreaming, streamingContent, updateConversation, removeConversation, setActiveConversation } = useChatStore();
  const user = useChatStore((s) => s.user);
  const { loadConversations, sendAll } = useChat();
  const subscriptionInactive = !!user?.subscription && !user.subscription.is_active;
  const subscriptionBlockMessage = user?.subscription?.subscription_scope === "organization"
    ? "Your organization's trial or subscription has ended. Ask the organization owner to update the subscription before continuing chat."
    : "Your free trial or subscription has ended. Please upgrade your plan before continuing chat.";

  // Restore client-side persisted state after hydration (avoids SSR/client mismatch)
  useEffect(() => {
    const savedMode = localStorage.getItem(CHAT_MODE_STORAGE_KEY) as ChatMode;
    if (savedMode === "general" || savedMode === "program") setChatMode(savedMode);

    const savedModel = localStorage.getItem(CHAT_MODEL_STORAGE_KEY);
    if (savedModel && isChatModelId(savedModel)) setSelectedModel(savedModel);

    const savedProjectId = localStorage.getItem(CHAT_PROJECT_STORAGE_KEY);
    if (!urlProjectId && savedProjectId) setSelectedProjectId(savedProjectId);

    const pendingText = sessionStorage.getItem("pendingChatMessage")?.trim();
    if (pendingText) {
      setPendingDisplayMsg({
        id: "pending-init",
        role: "user" as const,
        content: pendingText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadConversations().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!conversationId) return;
    setActiveConversation(conversationId);
    saveActiveConversationId(conversationId);
  }, [conversationId, setActiveConversation]);

  useEffect(() => {
    if (urlConversationId !== null) {
      isNewConversationRef.current = false;
      setConversationId(urlConversationId);
      setActiveConversation(urlConversationId);
      saveActiveConversationId(urlConversationId);
    }
  }, [urlConversationId, setActiveConversation]);

  useEffect(() => {
    if (urlProjectId !== null) setSelectedProjectId(urlProjectId);
    if (urlProjectId !== null && urlConversationId === null) {
      setConversationId(null);
    }
  }, [urlConversationId, urlProjectId]);

  useEffect(() => {
    if (urlConversationId !== null || conversationId) return;
    const savedConversationId = localStorage.getItem(ACTIVE_CONVERSATION_STORAGE_KEY);
    if (!savedConversationId) return;
    isNewConversationRef.current = false;
    setConversationId(savedConversationId);
    setActiveConversation(savedConversationId);
    router.replace(`/dashboard/chat?conversation=${encodeURIComponent(savedConversationId)}`);
  }, [conversationId, router, setActiveConversation, urlConversationId]);

  useEffect(() => {
    if (selectedProjectId) localStorage.setItem(CHAT_PROJECT_STORAGE_KEY, selectedProjectId);
    else localStorage.removeItem(CHAT_PROJECT_STORAGE_KEY);
  }, [selectedProjectId]);

  const pendingAutoMessage = useRef<string | null>(null);

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

  useEffect(() => {
    if (!conversationId) return;
    if (isNewConversationRef.current) return; // new chat: wait for streaming to finish
    chatApi.getConversation(conversationId)
      .then(c => {
        const inStore = (useChatStore.getState().conversations ?? []).find(x => x.id === c.id);
        if (inStore) updateConversation(c.id, c);
        else useChatStore.getState().addConversation(c);
      })
      .catch((err: unknown) => {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          const savedProjectId = localStorage.getItem(CHAT_PROJECT_STORAGE_KEY);
          setConversationId(null);
          setActiveConversation(null);
          saveActiveConversationId(null);
          if (savedProjectId) {
            setSelectedProjectId(savedProjectId);
            router.replace(`/dashboard/chat?projectId=${encodeURIComponent(savedProjectId)}`);
          } else {
            router.replace("/dashboard/chat");
          }
        }
      });
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshConversation = useCallback(async (id: string) => {
    try {
      const c = await chatApi.getConversation(id);
      const inStore = (useChatStore.getState().conversations ?? []).find(x => x.id === c.id);
      if (inStore) updateConversation(c.id, c);
      else useChatStore.getState().addConversation(c);
    } catch {
      // Ignore transient refresh errors; the next poll/navigation will reload it.
    }
  }, [updateConversation]);

  useEffect(() => {
    if (isStreaming) userScrolled.current = false;
  }, [isStreaming]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    userScrolled.current = el.scrollHeight - el.scrollTop - el.clientHeight >= 100;
  }, []);

  // ── Messages ────────────────────────────────────────────────────────────────

  const currentConversation = (conversations ?? []).find(c => c.id === conversationId);

  useEffect(() => {
    if (!currentConversation?.model) return;
    setSelectedModel(isChatModelId(currentConversation.model) ? currentConversation.model : DEFAULT_CHAT_MODEL);
  }, [currentConversation?.model]);

  // Restore chat mode from the loaded conversation
  useEffect(() => {
    const mode = currentConversation?.chat_mode;
    if (mode === "general" || mode === "program") setChatMode(mode);
  }, [currentConversation?.chat_mode]);

  useEffect(() => {
    if (!conversationId) return; // new chat — preserve any pre-selected project
    if (!currentConversation) return;
    setSelectedProjectId(currentConversation?.project_id ?? null);
  }, [conversationId, currentConversation]);

  const stableMessages = useMemo<DisplayMessage[]>(() => {
    let hasDocumentContext = !!currentConversation?.uploaded_filename || !!currentConversation?.active_file_id;
    return (currentConversation?.messages ?? []).map(msg => {
      if (msg.role === "user" && msg.attached_filename) {
        hasDocumentContext = true;
      }
      return {
        id:               msg.id,
        role:             msg.role as "user" | "assistant",
        content:          msg.content,
        timestamp:        new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isAnalysis:       msg.is_analysis ?? false,
        isAnalysisPotential: msg.role === "assistant" && hasDocumentContext,
        analysisData:     msg.is_analysis && msg.analysis_data
          ? (msg.analysis_data as Record<string, AnalysisAuthority>)
          : undefined,
        attachedFilename: msg.attached_filename ?? null,
        attachedUrl:      msg.attached_url ?? null,
      };
    });
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

    const isNew = !conversationId;
    const resolvedId = await sendAll({
      conversationId,
      message:     text,
      authorities: selectedAuthorities.length > 0 ? selectedAuthorities : undefined,
      model:       selectedModel,
      projectId:   isNew ? selectedProjectId ?? undefined : undefined,
      chatMode,
      onConversationReady: isNew ? (id) => {
        isNewConversationRef.current = true;
        setConversationId(id);
        setActiveConversation(id);
        saveActiveConversationId(id);
        router.replace(`/dashboard/chat?conversation=${encodeURIComponent(id)}`);
      } : undefined,
    });
    if (resolvedId && isNew) {
      setConversationId(resolvedId);
      setActiveConversation(resolvedId);
      saveActiveConversationId(resolvedId);
    }
  }, [input, isStreaming, conversationId, selectedAuthorities, selectedModel, selectedProjectId, chatMode, sendAll, router, setActiveConversation]);

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
    const isNew = !conversationId;
    const resolvedId = await sendAll({
      conversationId,
      message:     text,
      files,
      authorities: selectedAuthorities.length > 0 ? selectedAuthorities : undefined,
      model:       selectedModel,
      projectId:   isNew ? selectedProjectId ?? undefined : undefined,
      chatMode,
      onConversationReady: isNew ? (id) => {
        isNewConversationRef.current = true;
        setConversationId(id);
        setActiveConversation(id);
        saveActiveConversationId(id);
        router.replace(`/dashboard/chat?conversation=${encodeURIComponent(id)}`);
      } : undefined,
    });
    if (resolvedId && isNew) {
      setConversationId(resolvedId);
      setActiveConversation(resolvedId);
      saveActiveConversationId(resolvedId);
    }
  }, [conversationId, selectedAuthorities, selectedModel, selectedProjectId, chatMode, sendAll, router, setActiveConversation]);

  const handleAuthoritiesChange = useCallback(async (authorities: string[]) => {
    setSelectedAuthorities(authorities);
    if (conversationId) {
      await chatApi.updateAuthorities(conversationId, authorities).catch(() => {});
    }
  }, [conversationId]);

  const handleProjectChange = useCallback((projectId: string | null) => {
    setSelectedProjectId(projectId);
    const params = new URLSearchParams(searchParams.toString());
    if (projectId) params.set("projectId", projectId);
    else params.delete("projectId");
    const query = params.toString();
    router.replace(query ? `/dashboard/chat?${query}` : "/dashboard/chat");
    if (conversationId) {
      updateConversation(conversationId, { project_id: projectId });
    }
  }, [conversationId, router, searchParams, updateConversation]);

  const handleModelChange = useCallback((model: string) => {
    if (!isChatModelId(model)) return;
    setSelectedModel(model);
    localStorage.setItem(CHAT_MODEL_STORAGE_KEY, model);
    if (conversationId) {
      updateConversation(conversationId, { model });
      chatApi.updateConversation(conversationId, { model }).catch(() => {});
    }
  }, [conversationId, updateConversation]);

  const handleModeChange = useCallback((mode: ChatMode) => {
    setChatMode(mode);
    localStorage.setItem(CHAT_MODE_STORAGE_KEY, mode);
    if (conversationId) {
      updateConversation(conversationId, { chat_mode: mode });
      chatApi.updateConversation(conversationId, { chat_mode: mode }).catch(() => {});
    }
  }, [conversationId, updateConversation]);

  const handleChatSelect = useCallback((chatId: string) => {
    isNewConversationRef.current = false; // existing chat: fetch immediately
    setConversationId(chatId);
    setActiveConversation(chatId);
    saveActiveConversationId(chatId);
    setInput("");
    userScrolled.current = false;
    router.replace(`/dashboard/chat?conversation=${encodeURIComponent(chatId)}`);
  }, [router, setActiveConversation]);

  const handleNewChat = useCallback(() => {
    if (isStreaming) return;
    isNewConversationRef.current = false;
    setConversationId(null);
    setActiveConversation(null);
    saveActiveConversationId(null);
    setInput("");
    router.replace(selectedProjectId ? `/dashboard/chat?projectId=${encodeURIComponent(selectedProjectId)}` : "/dashboard/chat");
  }, [isStreaming, router, selectedProjectId, setActiveConversation]);

  const handleDeleteChat = useCallback((chatId?: string) => {
    if (isStreaming) return;
    const idToDelete = chatId ?? conversationId;
    if (!idToDelete) return;
    setDeleteConfirmId(idToDelete);
  }, [conversationId, isStreaming]);

  const confirmDeleteChat = useCallback(async () => {
    if (!deleteConfirmId) return;
    if (isStreaming) return;
    try {
      await chatApi.deleteConversation(deleteConfirmId);
      removeConversation(deleteConfirmId);
      if (deleteConfirmId === conversationId) {
        setConversationId(null);
        setActiveConversation(null);
        saveActiveConversationId(null);
        setInput("");
      }
    } catch { /* silently fail */ }
    setDeleteConfirmId(null);
  }, [deleteConfirmId, conversationId, isStreaming, removeConversation, setActiveConversation]);

  // ── Sidebar data ─────────────────────────────────────────────────────────────

  const [insightCounts, setInsightCounts] = useState<InsightCounts | null>(null);

  const fetchInsights = useCallback(async (id: string): Promise<boolean> => {
    try {
      const data = await chatApi.getInsights(id);
      const hasAny = data.guidelines > 0 || data.differences > 0 || data.riskAreas > 0 || data.recommendations > 0;
      setInsightCounts(hasAny ? data : null);
      return hasAny;
    } catch { return false; }
  }, []);

  useEffect(() => {
    if (!conversationId) { setInsightCounts(null); return; }
    fetchInsights(conversationId);
  }, [conversationId, fetchInsights]);

  const wasStreamingRef = useRef(false);
  const insightPollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const convIdRef       = useRef(conversationId); // always-fresh ref for event handler
  convIdRef.current = conversationId;

  const stopInsightPoll = useCallback(() => {
    if (insightPollRef.current) { clearInterval(insightPollRef.current); insightPollRef.current = null; }
  }, []);

  const startInsightPoll = useCallback((id: string) => {
    stopInsightPoll();
    let polls = 0;
    insightPollRef.current = setInterval(async () => {
      polls++;
      if (polls >= 60) { stopInsightPoll(); return; } // 60 × 5 s = 5 min max
      const found = await fetchInsights(id);
      if (found) stopInsightPoll();
    }, 5000);
  }, [fetchInsights, stopInsightPoll]);

  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && conversationId) {
      fetchInsights(conversationId);
      startInsightPoll(conversationId);

      if (isNewConversationRef.current) {
        isNewConversationRef.current = false;
        refreshConversation(conversationId);
      }
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, conversationId, fetchInsights, startInsightPoll, refreshConversation]);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = convIdRef.current;
      const detail = (e as CustomEvent).detail as { conversationId: string };
      if (id && detail.conversationId === id) {
        fetchInsights(id);
        refreshConversation(id);
        stopInsightPoll(); // no need to keep polling — we got the signal
      }
    };
    window.addEventListener("gi:export_ready", handler);
    return () => window.removeEventListener("gi:export_ready", handler);
  }, [fetchInsights, refreshConversation, stopInsightPoll]);

  useEffect(() => { return stopInsightPoll; }, [conversationId, stopInsightPoll]);

  const handleTemporaryMarked = useCallback((id: string) => {
    updateConversation(id, { is_temporary: true });
    if (id === conversationId) {
      setInsightCounts(null);
      saveActiveConversationId(null);
    }
  }, [conversationId, updateConversation]);

  const recentChats: RecentChatItem[] = (conversations ?? []).filter(c => !c.is_temporary).slice(0, 10).map(c => ({
    id:          c.id,
    title:       c.title ?? "New conversation",
    date:        new Date(c.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    canDelete:   c.user_id === user?.id || isOrgOwner,
    chatMode:    c.chat_mode,
    projectName: c.project_name,
    models:      c.models_used?.length ? c.models_used : (c.model ? [c.model] : []),
    category:    c.category,
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
          actionsDisabled={isStreaming}
          chatMode={chatMode}
          onModeChange={handleModeChange}
          modeDisabled={stableMessages.length > 0}
        />
      </div>

      <div className="flex flex-1 gap-6 min-h-0 px-4 md:px-6 lg:px-8">
        {/* Chat column */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="relative flex-1 min-h-0">
            <div ref={scrollContainerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide pr-6">
              <ChatMessages
                messages={displayMessages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                chatMode={chatMode}
                hasProgram={!!selectedProjectId}
              />
            </div>
            <ChatScrollbar scrollContainerRef={scrollContainerRef} messages={displayMessages} />
          </div>

          <ChatInputBar
            value={input}
            onChange={setInput}
            onSend={() => handleSendMessage()}
            onFileUpload={handleFileUpload}
            disabled={isStreaming || subscriptionInactive}
            chatMode={chatMode}
            hasProgram={!!selectedProjectId}
          />
          {subscriptionInactive && (
            <div className="border-t border-gs-border bg-gs-bg px-4 pb-4 text-center text-sm font-medium text-red-500">
              {subscriptionBlockMessage}
            </div>
          )}
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
            chatMode={chatMode}
            actionsDisabled={isStreaming}
            onTemporaryMarked={handleTemporaryMarked}
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
              chatMode={chatMode}
              actionsDisabled={isStreaming}
              onTemporaryMarked={handleTemporaryMarked}
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
