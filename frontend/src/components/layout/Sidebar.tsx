"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Plus, Trash2, LogOut } from "lucide-react";
import { cn, truncate } from "../../lib/utils";
import { useChatStore } from "../../store/chatStore";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../hooks/useAuth";

export function Sidebar() {
  const router = useRouter();
  const { conversations, activeConversationId } = useChatStore();
  const { loadConversations, deleteConversation } = useChat();
  const { logout } = useAuth();

  useEffect(() => {
    loadConversations().catch(console.error);
  }, [loadConversations]);

  async function handleNew() {
    const { chatApi } = await import("../../lib/api");
    const convo = await chatApi.createConversation();
    router.push(`/chat/${convo.id}`);
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    await deleteConversation(id);
    if (activeConversationId === id) router.push("/chat");
  }

  return (
    <aside className="w-64 flex flex-col h-full bg-muted/30 border-r">
      <div className="p-3 border-b">
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {conversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-8 px-4">
            No conversations yet. Start one!
          </p>
        )}
        {conversations.map((convo) => (
          <Link
            key={convo.id}
            href={`/chat/${convo.id}`}
            className={cn(
              "group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
              convo.id === activeConversationId
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50 text-muted-foreground hover:text-foreground",
            )}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{truncate(convo.title ?? "New conversation", 30)}</span>
            <button
              onClick={(e) => handleDelete(e, convo.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Link>
        ))}
      </div>

      <div className="p-3 border-t">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
