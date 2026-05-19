"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, ChevronDown, Plus, PanelRight, Trash2, Check } from "lucide-react";
import { CHAT_MODELS, getChatModelLabel } from "../../lib/chatModels";

export type ChatMode = "general" | "program";

interface ChatHeaderProps {
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  onDeleteChat?: () => void;
  hasActiveChat?: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  modelDisabled?: boolean;
  chatMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  modeDisabled?: boolean;
  actionsDisabled?: boolean;
}

function ModelDropdown({
  selectedModel,
  onModelChange,
  disabled,
}: {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = getChatModelLabel(selectedModel);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-2.5 sm:px-3 py-2 bg-gs-card border border-gs-border rounded-lg shadow-sm min-h-[40px] md:min-h-[44px] hover:bg-gs-bg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Bot size={16} className="text-blue-600 shrink-0" />
        <span className="text-sm font-semibold text-gs-text whitespace-nowrap">{selectedLabel}</span>
        <ChevronDown
          size={14}
          className={`text-gs-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-52 bg-gs-card border border-gs-border rounded-xl shadow-lg z-50 overflow-hidden py-1.5">
          {CHAT_MODELS.map(model => {
            const active = model.id === selectedModel;
            return (
              <button
                key={model.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onModelChange(model.id); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600"
                    : "text-gs-text hover:bg-gs-bg"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold leading-none">{model.label}</p>
                  <p className="text-[11px] text-gs-muted mt-0.5">{model.provider}</p>
                </div>
                {active && <Check size={14} className="text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChatHeader({
  onNewChat,
  onToggleSidebar,
  onDeleteChat,
  hasActiveChat,
  selectedModel,
  onModelChange,
  modelDisabled,
  chatMode,
  onModeChange,
  modeDisabled,
  actionsDisabled,
}: ChatHeaderProps) {
  return (
    <div className="flex justify-between items-start gap-4">
      <div>
        <h1 className="text-lg md:text-[28px] mb-3 font-bold text-gs-text tracking-tight">
          Regulatory Chat
        </h1>
        <p className="hidden md:block text-gs-muted text-sm">
          Ask freely in General Mode. Go deeper with Program Mode for regulatory strategy, industry guidance, and program-specific work.
        </p>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => !modeDisabled && onModeChange("general")}
            disabled={modeDisabled}
            title={modeDisabled ? "Mode cannot be changed once a chat has started" : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
              chatMode === "general"
                ? "border-gs-blue text-gs-blue bg-gs-blue/5"
                : "border-gs-border text-gs-text bg-gs-card hover:bg-gs-bg"
            } ${modeDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {chatMode === "general" && <Check size={14} className="text-gs-blue" />}
            General Mode
          </button>
          <button
            onClick={() => !modeDisabled && onModeChange("program")}
            disabled={modeDisabled}
            title={modeDisabled ? "Mode cannot be changed once a chat has started" : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
              chatMode === "program"
                ? "border-gs-blue text-gs-blue bg-gs-blue/5"
                : "border-gs-border text-gs-text bg-gs-card hover:bg-gs-bg"
            } ${modeDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {chatMode === "program" && <Check size={14} className="text-gs-blue" />}
            Program Mode
          </button>
          {modeDisabled && (
            <span className="text-[10px] text-gs-muted font-medium">Locked for this chat</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 shrink-0 items-center mt-1">
        <ModelDropdown
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          disabled={modelDisabled}
        />

        <button
          onClick={() => !actionsDisabled && onNewChat?.()}
          disabled={actionsDisabled}
          title={actionsDisabled ? "Wait for the current response to finish" : undefined}
          className="flex items-center gap-2 px-2.5 md:px-4 py-2 bg-gs-card border border-gs-border text-gs-text rounded-lg text-sm font-semibold shadow-sm hover:bg-gs-bg transition-colors min-h-[40px] md:min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gs-card"
          aria-label="New Chat"
        >
          <Plus size={16} className="text-blue-600" />
          <span className="hidden md:inline">New Chat</span>
        </button>

        {hasActiveChat && onDeleteChat && (
          <button
            onClick={() => !actionsDisabled && onDeleteChat()}
            disabled={actionsDisabled}
            className="flex items-center gap-2 px-2.5 md:px-4 py-2 bg-gs-card border border-gs-border text-gs-muted rounded-lg text-sm font-semibold shadow-sm hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 hover:border-red-300 transition-colors min-h-[40px] md:min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gs-card disabled:dark:hover:bg-gs-card disabled:hover:text-gs-muted disabled:hover:border-gs-border"
            aria-label="Delete Chat"
            title={actionsDisabled ? "Wait for the current response to finish" : "Delete this chat"}
          >
            <Trash2 size={16} />
            <span className="hidden md:inline">Delete</span>
          </button>
        )}

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
