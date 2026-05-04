"use client";

import { useCallback } from "react";
import { chatApi } from "../lib/api";
import { useChatStore } from "../store/chatStore";
import type { Message } from "../types";

export function useChat() {
  const store = useChatStore();

  const loadConversations = useCallback(async () => {
    const convos = await chatApi.listConversations();
    store.setConversations(convos);
  }, [store]);

  const startNewConversation = useCallback(
    async (model = "gpt-4o") => {
      const convo = await chatApi.createConversation(model);
      store.addConversation(convo);
      store.setActiveConversation(convo.id);
      return convo;
    },
    [store],
  );

  const sendMessage = useCallback(
    async (conversationId: string, text: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: "user",
        content: text,
        token_count: null,
        created_at: new Date().toISOString(),
      };
      store.appendMessage(conversationId, userMsg);
      store.setIsStreaming(true);
      store.setStreamingContent("");

      let accumulated = "";
      try {
        for await (const chunk of chatApi.sendMessage(conversationId, text)) {
          if (chunk.type === "delta" && chunk.content) {
            accumulated += chunk.content;
            store.setStreamingContent(accumulated);
          } else if (chunk.type === "done") {
            const assistantMsg: Message = {
              id: chunk.message_id ?? crypto.randomUUID(),
              conversation_id: conversationId,
              role: "assistant",
              content: accumulated,
              token_count: null,
              created_at: new Date().toISOString(),
            };
            store.appendMessage(conversationId, assistantMsg);
          } else if (chunk.type === "error") {
            const errorMsg: Message = {
              id: crypto.randomUUID(),
              conversation_id: conversationId,
              role: "assistant",
              content: chunk.error ?? "Something went wrong. Please try again.",
              token_count: null,
              created_at: new Date().toISOString(),
            };
            store.appendMessage(conversationId, errorMsg);
          }
        }
      } catch {
        // Network-level failure — show inline error instead of crashing
        if (!accumulated) {
          const errorMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: conversationId,
            role: "assistant",
            content: "The request timed out. Please try again.",
            token_count: null,
            created_at: new Date().toISOString(),
          };
          store.appendMessage(conversationId, errorMsg);
        }
      } finally {
        store.setIsStreaming(false);
        store.setStreamingContent("");
      }
    },
    [store],
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      await chatApi.deleteConversation(id);
      store.removeConversation(id);
    },
    [store],
  );

  return { loadConversations, startNewConversation, sendMessage, deleteConversation };
}
