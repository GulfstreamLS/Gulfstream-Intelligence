"use client";

import { useState } from "react";
import { Search, Send } from "lucide-react";

export function QuickSearch() {
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    // navigate to chat with pre-filled query
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="flex items-center gap-3 bg-gs-card border border-gs-border rounded-xl px-4 py-3 shadow-card focus-within:ring-2 focus-within:ring-gs-blue focus-within:border-gs-blue transition-all">
        <Search className="w-5 h-5 text-gs-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="How can I help you today?"
          className="flex-1 bg-transparent text-sm text-gs-text placeholder:text-gs-muted outline-none"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="w-8 h-8 rounded-full bg-gs-blue flex items-center justify-center text-white hover:bg-gs-deep-blue transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
          aria-label="Submit"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
}
