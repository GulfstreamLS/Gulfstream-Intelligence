"use client";

import { useState, useRef, useCallback } from "react";
import type { Dispatch, SetStateAction, KeyboardEvent, ChangeEvent } from "react";
import { Send, Paperclip, X, Loader2, FileText } from "lucide-react";

interface ChatInputBarProps {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  onSend: () => void;
  onFileUpload?: (file: File, text?: string) => Promise<void>;
  disabled?: boolean;
}

const ACCEPTED = ".pdf,.docx,.doc,.txt,.pptx,.png,.jpg,.jpeg";

export function ChatInputBar({ value, onChange, onSend, onFileUpload, disabled }: ChatInputBarProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = "";
  };

  const handleSend = useCallback(async () => {
    if (isUploading) return;

    if (pendingFile && onFileUpload) {
      const fileToSend = pendingFile;
      const textToSend = value.trim() || undefined;
      // Clear immediately so chip disappears before the long streaming wait
      setPendingFile(null);
      onChange("");
      setIsUploading(true);
      try {
        await onFileUpload(fileToSend, textToSend);
      } finally {
        setIsUploading(false);
      }
    } else {
      onSend();
    }
  }, [isUploading, pendingFile, onFileUpload, value, onSend, onChange]);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isBusy = disabled || isUploading;
  const canSend = !isBusy && (!!value.trim() || !!pendingFile);

  return (
    <div className="border-t border-gs-border bg-gs-bg pt-3 pb-4">
      {/* File chip */}
      {pendingFile && (
        <div className="flex items-center gap-2 mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gs-card border border-gs-blue/30 rounded-lg text-xs text-gs-text max-w-xs">
            <FileText size={13} className="text-gs-blue shrink-0" />
            <span className="truncate font-medium">{pendingFile.name}</span>
            <span className="text-gs-muted shrink-0">
              ({(pendingFile.size / 1024).toFixed(0)} KB)
            </span>
            <button
              onClick={() => setPendingFile(null)}
              className="text-gs-muted hover:text-gs-red transition-colors shrink-0 ml-1"
              aria-label="Remove attachment"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Paperclip button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-gs-muted hover:text-gs-blue hover:bg-gs-bg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Attach file"
          title="Attach file (PDF, DOCX, TXT, PPTX, PNG, JPG)"
        >
          <Paperclip size={17} />
        </button>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={isBusy}
          placeholder={pendingFile ? "Add a message or just send the file…" : "Ask a follow-up question…"}
          className="w-full py-4 pl-11 pr-14 bg-gs-card border border-gs-border rounded-2xl shadow-card focus:outline-none focus:border-gs-blue text-sm text-gs-text placeholder:text-gs-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {/* Send / uploading button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-gs-blue text-white p-2.5 rounded-xl hover:bg-gs-deep-blue transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isUploading ? "Uploading…" : "Send"}
        >
          {isUploading
            ? <Loader2 size={17} className="animate-spin" />
            : <Send size={17} />
          }
        </button>
      </div>

      <p className="text-center text-[10px] text-gs-muted mt-2.5">
        Gulfstream Intelligence can make mistakes. Consider verifying important information.
      </p>
    </div>
  );
}
