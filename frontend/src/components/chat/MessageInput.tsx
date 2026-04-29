"use client";

import { useRef, useState } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (text: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function MessageInput({ onSend, isStreaming, disabled }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const text = value.trim();
    if (!text || isStreaming || disabled) return;
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend(text);
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-3xl mx-auto flex gap-3 items-end">
        <div className="flex-1 border rounded-xl bg-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Message Gulfstream Intelligence…"
            className="w-full px-4 py-3 bg-transparent resize-none text-sm focus:outline-none disabled:opacity-50"
          />
        </div>
        <button
          onClick={submit}
          disabled={(!value.trim() && !isStreaming) || disabled}
          className={cn(
            "p-3 rounded-xl transition-colors disabled:opacity-30",
            isStreaming
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-primary hover:bg-primary/90 text-primary-foreground",
          )}
        >
          {isStreaming ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for newline.
      </p>
    </div>
  );
}
