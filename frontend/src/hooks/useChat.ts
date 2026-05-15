"use client";

import { useCallback } from "react";
import { chatApi, isPaymentRequiredError } from "../lib/api";
import { DEFAULT_CHAT_MODEL } from "../lib/chatModels";
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
    files?: File | File[];
    authorities?: string[];
    model?: string;
    projectId?: string;
    onConversationReady?: (id: string) => void;
  }): Promise<string | null> => {
    const isNew = !params.conversationId;
    const fileList = params.files
      ? Array.isArray(params.files) ? params.files : [params.files]
      : [];
    const firstFilename = fileList[0]?.name ?? null;
    const attachedLabel = fileList.length > 1
      ? fileList.map(f => f.name).join(", ")
      : firstFilename;

    // For new conversations: create a temp conversation immediately so the user
    // sees their message the instant they hit send, before the server responds.
    const tempId = isNew ? crypto.randomUUID() : null;

    if (isNew && tempId) {
      const tempConvo: Conversation = {
        id: tempId,
        title: null,
        model: params.model ?? DEFAULT_CHAT_MODEL,
        system_prompt: null,
        project_id: params.projectId ?? null,
        project_name: null,
        organization_id: store.user?.organization_id ?? null,
        user_id: store.user?.id ?? null,
        user_full_name: store.user?.full_name ?? null,
        user_email: store.user?.email ?? null,
        uploaded_filename: firstFilename,
        uploaded_url: null,
        uploaded_type: null,
        active_file_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      };
      store.addConversation(tempConvo);
      params.onConversationReady?.(tempId);
    }

    // Optimistic user message — one combined bubble for both file and text
    const optimisticTarget = params.conversationId ?? tempId;
    if (optimisticTarget && (fileList.length > 0 || params.message)) {
      store.appendMessage(optimisticTarget, {
        id: crypto.randomUUID(),
        conversation_id: optimisticTarget,
        role: "user",
        content: params.message ?? "",
        attached_filename: attachedLabel,
        token_count: null,
        created_at: new Date().toISOString(),
      } as Message);
    }

    store.setIsStreaming(true);
    store.setStreamingContent("");

    let resolvedId = params.conversationId ?? null;
    let accumulated = "";
    let displayed = "";
    let animIntervalId: ReturnType<typeof setInterval> | null = null;
    let pendingCommit: (() => void) | null = null;

    // Advances the visible streaming content one step at a time.
    // When the animation catches up AND a commit is pending, executes it.
    const CHARS_PER_TICK = 8; // ~250 chars/sec at 60 fps — fast but visibly animated
    const tick = () => {
      if (displayed.length < accumulated.length) {
        displayed = accumulated.slice(0, Math.min(displayed.length + CHARS_PER_TICK, accumulated.length));
        store.setStreamingContent(displayed);
      } else if (pendingCommit) {
        clearInterval(animIntervalId!);
        animIntervalId = null;
        const commit = pendingCommit;
        pendingCommit = null;
        commit();
      }
    };

    try {
      for await (const chunk of chatApi.send({ ...params, files: fileList })) {

        if (chunk.type === "conversation_ready") {
          resolvedId = chunk.id!;
          if (tempId) {
            store.replaceConversationId(tempId, chunk.id!);
            params.onConversationReady?.(chunk.id!);
          }

        } else if (chunk.type === "delta" && chunk.content) {
          accumulated += chunk.content;
          if (animIntervalId === null) {
            animIntervalId = setInterval(tick, 16);
          }

        } else if (chunk.type === "analysis") {
          if (resolvedId && chunk.message_id) {
            store.updateMessage(resolvedId, chunk.message_id, {
              is_analysis: true,
              analysis_data: chunk.data ?? null,
            });
          }

        } else if (chunk.type === "done") {
          // Don't commit immediately — let the animation finish first.
          // tick() will call pendingCommit once displayed catches up to accumulated.
          const msgId = chunk.message_id ?? crypto.randomUUID();
          pendingCommit = () => {
            if (accumulated && resolvedId) {
              store.appendMessage(resolvedId, {
                id: msgId,
                conversation_id: resolvedId,
                role: "assistant",
                content: accumulated,
                token_count: null,
                created_at: new Date().toISOString(),
              });
            }
            store.setIsStreaming(false);
            store.setStreamingContent("");
          };
          if (animIntervalId === null) {
            // No animation running (empty response) — commit immediately.
            const commit = pendingCommit;
            pendingCommit = null;
            commit();
          }

        } else if (chunk.type === "title_update") {
          const target = resolvedId ?? tempId;
          if (target && chunk.content) {
            store.updateConversation(target, { title: chunk.content });
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
      // For loop exited normally.
      // If pendingCommit is set, the interval is still running and will commit when caught up.
      // If neither is set, the stream ended without a done chunk — force cleanup.
      if (pendingCommit === null && animIntervalId === null) {
        store.setIsStreaming(false);
        store.setStreamingContent("");
      }
    } catch (error) {
      // On error, cancel any running animation and clean up immediately.
      if (animIntervalId !== null) { clearInterval(animIntervalId); animIntervalId = null; }
      pendingCommit = null;
      const errorTarget = resolvedId ?? tempId;
      if (!accumulated && errorTarget) {
        const content = isPaymentRequiredError(error)
          ? "Your free trial has ended. Please upgrade your plan from Subscription to continue using chat."
          : "The request could not be completed. Please try again.";
        store.appendMessage(errorTarget, {
          id: crypto.randomUUID(), conversation_id: errorTarget,
          role: "assistant", content,
          token_count: null, created_at: new Date().toISOString(),
        });
      }
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
