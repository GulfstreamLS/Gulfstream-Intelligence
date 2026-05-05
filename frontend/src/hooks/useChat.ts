"use client";

import { useCallback } from "react";
import { chatApi } from "../lib/api";
import { useChatStore } from "../store/chatStore";
import type { Conversation, Message } from "../types";

export function useChat() {
  const store = useChatStore();

  const loadConversations = useCallback(async () => {
    const convos = await chatApi.listConversations();
    store.setConversations(convos);
  }, [store]);

  /**
   * Unified send — handles conversation creation, file upload, authority update,
   * and message streaming in a single API call.
   * Returns the resolved conversation ID (existing or newly created).
   */
  const sendAll = useCallback(async (params: {
    conversationId?: string | null;
    message?: string;
    file?: File;
    authorities?: string[];
  }): Promise<string | null> => {
    const isNew = !params.conversationId;

    // Optimistic messages for existing conversations (we know the ID already)
    if (!isNew && params.conversationId) {
      if (params.file) {
        store.appendMessage(params.conversationId, {
          id: crypto.randomUUID(),
          conversation_id: params.conversationId,
          role: "user",
          content: `📎 ${params.file.name} (${(params.file.size / 1024).toFixed(0)} KB)`,
          token_count: null,
          created_at: new Date().toISOString(),
        });
      }
      if (params.message) {
        store.appendMessage(params.conversationId, {
          id: crypto.randomUUID(),
          conversation_id: params.conversationId,
          role: "user",
          content: params.message,
          token_count: null,
          created_at: new Date().toISOString(),
        });
      }
    }

    store.setIsStreaming(true);
    store.setStreamingContent("");

    let resolvedId = params.conversationId ?? null;
    let accumulated = "";

    try {
      for await (const chunk of chatApi.send(params)) {

        if (chunk.type === "conversation_ready") {
          // New conversation — add to store and show optimistic messages
          resolvedId = chunk.id!;
          const newConvo: Conversation = {
            id: chunk.id!,
            title: null,
            model: chunk.model ?? "gpt-4o",
            system_prompt: null,
            created_at: chunk.created_at ?? new Date().toISOString(),
            updated_at: chunk.updated_at ?? new Date().toISOString(),
            messages: [],
          };
          store.addConversation(newConvo);
          if (params.file) {
            store.appendMessage(chunk.id!, {
              id: crypto.randomUUID(), conversation_id: chunk.id!,
              role: "user",
              content: `📎 ${params.file.name} (${(params.file.size / 1024).toFixed(0)} KB)`,
              token_count: null, created_at: new Date().toISOString(),
            });
          }
          if (params.message) {
            store.appendMessage(chunk.id!, {
              id: crypto.randomUUID(), conversation_id: chunk.id!,
              role: "user", content: params.message,
              token_count: null, created_at: new Date().toISOString(),
            });
          }

        } else if (chunk.type === "delta" && chunk.content) {
          accumulated += chunk.content;
          store.setStreamingContent(accumulated);

        } else if (chunk.type === "analysis") {
          if (resolvedId) {
            // Stream the analysis text word-by-word before committing to messages
            const analysisContent = chunk.content ?? "";
            if (analysisContent) {
              let streamed = "";
              for (const word of analysisContent.split(" ")) {
                streamed += (streamed ? " " : "") + word;
                store.setStreamingContent(streamed);
                await new Promise<void>(r => setTimeout(r, 25));
              }
              store.setStreamingContent("");
            }
            store.appendMessage(resolvedId, {
              id: chunk.message_id ?? crypto.randomUUID(),
              conversation_id: resolvedId, role: "assistant",
              content: analysisContent, token_count: null,
              is_analysis: true, analysis_data: chunk.data ?? null,
              created_at: new Date().toISOString(),
            } as Message);
          }

        } else if (chunk.type === "done") {
          if (accumulated && resolvedId) {
            store.appendMessage(resolvedId, {
              id: chunk.message_id ?? crypto.randomUUID(),
              conversation_id: resolvedId, role: "assistant",
              content: accumulated, token_count: null,
              created_at: new Date().toISOString(),
            });
          }

        } else if (chunk.type === "error") {
          if (resolvedId) {
            store.appendMessage(resolvedId, {
              id: crypto.randomUUID(), conversation_id: resolvedId,
              role: "assistant",
              content: chunk.error ?? "Something went wrong. Please try again.",
              token_count: null, created_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      if (!accumulated && resolvedId) {
        store.appendMessage(resolvedId, {
          id: crypto.randomUUID(), conversation_id: resolvedId,
          role: "assistant", content: "The request timed out. Please try again.",
          token_count: null, created_at: new Date().toISOString(),
        });
      }
    } finally {
      store.setIsStreaming(false);
      store.setStreamingContent("");
    }

    return resolvedId;
  }, [store]);

  const deleteConversation = useCallback(async (id: string) => {
    await chatApi.deleteConversation(id);
    store.removeConversation(id);
  }, [store]);

  return { loadConversations, sendAll, deleteConversation };
}
