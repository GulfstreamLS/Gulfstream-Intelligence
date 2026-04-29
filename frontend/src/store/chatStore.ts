import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Conversation, Message, User } from "@/types";

interface ChatState {
  user: User | null;
  conversations: Conversation[];
  activeConversationId: string | null;
  streamingContent: string;
  isStreaming: boolean;

  setUser: (user: User | null) => void;
  setConversations: (convos: Conversation[]) => void;
  addConversation: (convo: Conversation) => void;
  updateConversation: (id: string, patch: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  appendMessage: (conversationId: string, message: Message) => void;
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
      setConversations: (conversations) => set({ conversations }),
      addConversation: (convo) =>
        set((s) => ({ conversations: [convo, ...s.conversations] })),
      updateConversation: (id, patch) =>
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeConversation: (id) =>
        set((s) => ({
          conversations: s.conversations.filter((c) => c.id !== id),
          activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
        })),
      setActiveConversation: (id) => set({ activeConversationId: id }),
      appendMessage: (conversationId, message) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, messages: [...c.messages, message] } : c,
          ),
        })),
      setStreamingContent: (streamingContent) => set({ streamingContent }),
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) ?? null;
      },
    }),
    { name: "chat-store", partialize: (s) => ({ activeConversationId: s.activeConversationId }) },
  ),
);
