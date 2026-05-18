import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Conversation, Message, User } from "../types";

interface ChatState {
  user: User | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  streamingContent: string;
  isStreaming: boolean;

  setUser: (user: User | null) => void;
  logout: () => void;
  setConversations: (convos: Conversation[]) => void;
  addConversation: (convo: Conversation) => void;
  updateConversation: (id: string, patch: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  replaceConversationId: (oldId: string, newId: string) => void;
  setActiveConversation: (id: string | null) => void;
  appendMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, patch: Partial<Message>) => void;
  setStreamingContent: (content: string) => void;
  setIsStreaming: (v: boolean) => void;
  getActiveConversation: () => Conversation | null;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      user: null,
      conversations: [],
      activeConversationId: null,
      streamingContent: "",
      isStreaming: false,

      setUser: (user) => set({ user }),
      logout: () => set({ user: null, conversations: [], activeConversationId: null }),
      setConversations: (conversations) => set({ conversations: conversations ?? [] }),
      addConversation: (convo) =>
        set((s) => ({
          conversations: [convo, ...(s.conversations ?? []).filter((c) => c.id !== convo.id)],
        })),
      updateConversation: (id, patch) =>
        set((s) => ({
          conversations: (s.conversations ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeConversation: (id) =>
        set((s) => ({
          conversations: (s.conversations ?? []).filter((c) => c.id !== id),
          activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
        })),
      replaceConversationId: (oldId, newId) =>
        set((s) => ({
          conversations: (s.conversations ?? []).map((c) =>
            c.id === oldId
              ? { ...c, id: newId, messages: (c.messages ?? []).map(m => ({ ...m, conversation_id: newId })) }
              : c
          ),
        })),
      setActiveConversation: (id) => set({ activeConversationId: id }),
      appendMessage: (conversationId, message) =>
        set((s) => ({
          conversations: (s.conversations ?? []).map((c) =>
            c.id === conversationId ? { ...c, messages: [...(c.messages ?? []), message] } : c,
          ),
        })),
      updateMessage: (conversationId, messageId, patch) =>
        set((s) => ({
          conversations: (s.conversations ?? []).map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: (c.messages ?? []).map((m) =>
                    m.id === messageId ? { ...m, ...patch } : m
                  ),
                }
              : c
          ),
        })),
      setStreamingContent: (streamingContent) => set({ streamingContent }),
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return (conversations ?? []).find((c) => c.id === activeConversationId) ?? null;
      },
    }),
    { name: "chat-store", partialize: (s) => ({ activeConversationId: s.activeConversationId }) },
  ),
);
