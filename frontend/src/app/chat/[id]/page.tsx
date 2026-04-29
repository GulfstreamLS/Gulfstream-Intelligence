"use client";

import { useEffect, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { StreamingBubble } from "@/components/chat/StreamingBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { useChatStore } from "@/store/chatStore";
import { useChat } from "@/hooks/useChat";
import { chatApi } from "@/lib/api";

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialQueryHandled = useRef(false);

  const { conversations, isStreaming, streamingContent, setActiveConversation, updateConversation } =
    useChatStore();
  const { sendMessage } = useChat();

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
      sendMessage(id, q).catch(console.error);
    }
  }, [id, searchParams, conversation, sendMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, streamingContent]);

  async function handleSend(text: string) {
    await sendMessage(id, text);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto chat-scroll p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {conversation?.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isStreaming && <StreamingBubble content={streamingContent} />}
          <div ref={bottomRef} />
        </div>
      </div>

      <MessageInput onSend={handleSend} isStreaming={isStreaming} />
    </div>
  );
}
