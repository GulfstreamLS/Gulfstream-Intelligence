"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useChat } from "@/hooks/useChat";

const SUGGESTIONS = [
  "Explain quantum computing in simple terms",
  "Write a Python function to parse JSON from an API",
  "What are the best practices for a production FastAPI app?",
  "Help me write a cover letter for a software engineer role",
];

export default function ChatHomePage() {
  const router = useRouter();
  const { startNewConversation } = useChat();

  async function handleSuggestion(text: string) {
    const convo = await startNewConversation();
    router.push(`/chat/${convo.id}?q=${encodeURIComponent(text)}`);
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">How can I help you today?</h1>
        <p className="text-muted-foreground">Powered by Gulfstream Intelligence</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSuggestion(s)}
            className="text-left p-4 border rounded-xl hover:bg-accent text-sm transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
