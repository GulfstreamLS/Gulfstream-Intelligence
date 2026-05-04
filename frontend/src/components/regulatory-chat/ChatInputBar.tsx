import { Send } from "lucide-react";
import type { Dispatch, SetStateAction, KeyboardEvent } from "react";

interface ChatInputBarProps {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInputBar({ value, onChange, onSend, disabled }: ChatInputBarProps) {
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-gs-border bg-gs-bg pt-3 pb-4">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder="Ask a follow-up question..."
          className="w-full py-4 pl-5 pr-14 bg-gs-card border border-gs-border rounded-2xl shadow-card focus:outline-none focus:border-gs-blue text-sm text-gs-text placeholder:text-gs-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-gs-blue text-white p-2.5 rounded-xl hover:bg-gs-deep-blue transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send size={17} />
        </button>
      </div>
      <p className="text-center text-[10px] text-gs-muted mt-2.5">
        Gulfstream Intelligence can make mistakes. Consider verifying important information.
      </p>
    </div>
  );
}
