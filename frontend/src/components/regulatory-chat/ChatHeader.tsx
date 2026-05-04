import { Plus, Share2, PanelRight } from "lucide-react";

interface ChatHeaderProps {
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
}

export function ChatHeader({ onNewChat, onToggleSidebar }: ChatHeaderProps) {
  return (
    <div className="flex justify-between items-center gap-4">
      <div>
        <h1 className="text-lg md:text-[28px] font-bold text-gs-text tracking-tight">
          Regulatory Chat
        </h1>
        <p className="hidden md:block text-gs-muted text-sm mt-1">
          Ask anything. Get strategic answers powered by global regulatory intelligence.
        </p>
      </div>

      <div className="flex gap-2 shrink-0">
        {/* Mobile: icon only. Desktop: icon + label */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 px-2.5 md:px-4 py-2 bg-gs-card border border-gs-border text-gs-text rounded-lg text-sm font-semibold shadow-sm hover:bg-gs-bg transition-colors min-h-[40px] md:min-h-[44px]"
          aria-label="New Chat"
        >
          <Plus size={16} className="text-gs-blue" />
          <span className="hidden md:inline">New Chat</span>
        </button>
        <button
          className="p-2.5 bg-gs-card border border-gs-border rounded-lg shadow-sm hover:bg-gs-bg transition-colors min-h-[40px] min-w-[40px] md:min-h-[44px] md:min-w-[44px] flex items-center justify-center"
          aria-label="Share"
        >
          <Share2 size={16} className="text-gs-muted" />
        </button>
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2.5 bg-gs-card border border-gs-border rounded-lg shadow-sm hover:bg-gs-bg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          <PanelRight size={16} className="text-gs-muted" />
        </button>
      </div>
    </div>
  );
}
