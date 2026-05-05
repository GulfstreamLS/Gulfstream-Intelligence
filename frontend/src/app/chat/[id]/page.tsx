"use client";

import { useEffect, useRef, useCallback, use } from "react";
import { useSearchParams } from "next/navigation";
import { MessageBubble } from "../../../components/chat/MessageBubble";
import { StreamingBubble } from "../../../components/chat/StreamingBubble";
import { MessageInput } from "../../../components/chat/MessageInput";
import { useChatStore } from "../../../store/chatStore";
import { useChat } from "../../../hooks/useChat";
import { chatApi } from "../../../lib/api";

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolled = useRef(false);
  const initialQueryHandled = useRef(false);

  const { conversations, isStreaming, streamingContent, setActiveConversation, updateConversation } =
    useChatStore();
  const { sendAll } = useChat();

  const conversation = conversations.find((c) => c.id === id);

  useEffect(() => {
    setActiveConversation(id);
    if (!conversation) {
      chatApi.getConversation(id).then((convo) => {
        updateConversation(id, convo);
      }).catch(console.error);
    }
  }, [id, conversation, setActiveConversation, updateConversation]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !initialQueryHandled.current && conversation) {
      initialQueryHandled.current = true;
      sendAll({ conversationId: id, message: q }).catch(console.error);
    }
  }, [id, searchParams, conversation, sendAll]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    userScrolled.current = !atBottom;
  }, []);

  useEffect(() => {
    if (userScrolled.current) return;
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [conversation?.messages, streamingContent]);

  async function handleSend(text: string) {
    await sendAll({ conversationId: id, message: text });
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto chat-scroll p-4"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {conversation?.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isStreaming && <StreamingBubble content={streamingContent} />}
        </div>
      </div>

      <MessageInput onSend={handleSend} isStreaming={isStreaming} />
    </div>
  );
}
