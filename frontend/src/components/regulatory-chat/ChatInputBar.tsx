"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction, KeyboardEvent, ChangeEvent } from "react";
import { ArrowUp, Plus, X, Loader2, FileText, Archive, Mic, Check } from "lucide-react";
import { chatApi } from "../../lib/api";

interface ChatInputBarProps {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
  onSend: () => void;
  onFileUpload?: (files: File[], text?: string) => Promise<void>;
  disabled?: boolean;
  chatMode?: "general" | "program";
  hasProgram?: boolean;
}

const ACCEPTED = ".pdf,.docx,.doc,.txt,.pptx,.png,.jpg,.jpeg,.zip";

// Textarea grows from 1 line to 6 lines then scrolls
const LINE_H     = 20;           // text-sm line-height px
const MAX_LINES  = 6;
const MAX_CONTENT_H = LINE_H * MAX_LINES;  // pure content height, no padding

const CSS_H_PX = 26;

// ── Waveform ──────────────────────────────────────────────────────────────────
function Waveform({ analyserRef }: { analyserRef: React.RefObject<AnalyserNode | null> }) {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const smooth    = useRef<Float32Array>(new Float32Array(200));
  const widthRef  = useRef(0);   // authoritative width, updated only by ResizeObserver

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx   = canvas.getContext("2d")!;
    const dpr   = window.devicePixelRatio || 1;
    const CSS_H = CSS_H_PX;
    const BAR_W = 2;
    const GAP   = 2.5;

    function applySize(w: number) {
      widthRef.current   = w;
      canvas!.width      = Math.round(w * dpr);
      canvas!.height     = Math.round(CSS_H * dpr);
      // Let CSS width track the wrapper — no inline style on canvas
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ResizeObserver fires on every layout change (resize, sidebar open/close, etc.)
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0]!.contentRect.width);
      if (w > 0 && w !== widthRef.current) applySize(w);
    });
    ro.observe(wrap);

    // Seed initial size in case observer fires late
    if (wrap.clientWidth > 0) applySize(wrap.clientWidth);

    function frame() {
      rafRef.current = requestAnimationFrame(frame);
      const W = widthRef.current;
      if (!W) return;

      const MID   = CSS_H / 2;
      const COUNT = Math.max(1, Math.floor(W / (BAR_W + GAP)));

      ctx.clearRect(0, 0, W, CSS_H);

      const analyser = analyserRef.current;
      const raw = new Uint8Array(analyser?.frequencyBinCount ?? 0);
      if (analyser) analyser.getByteFrequencyData(raw);
      const step = raw.length > 0 ? Math.max(1, Math.floor(raw.length / COUNT)) : 1;

      for (let i = 0; i < COUNT; i++) {
        const target = analyser && raw.length > 0
          ? (raw[i * step] ?? 0) / 255
          : (Math.sin(Date.now() / 900 + i * 0.5) * 0.5 + 0.5) * 0.15;

        const prev = smooth.current[i] ?? 0;
        smooth.current[i] = target > prev ? prev * 0.4 + target * 0.6 : prev * 0.88;
        const v = smooth.current[i]!;

        const halfH = Math.max(1.5, v * MID * 0.9);
        ctx.fillStyle = `rgba(59,130,246,${(0.25 + v * 0.75).toFixed(3)})`;
        ctx.beginPath();
        ctx.roundRect(i * (BAR_W + GAP), MID - halfH, BAR_W, halfH * 2, 1);
        ctx.fill();
      }
    }

    frame();
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [analyserRef]);

  return (
    <div ref={wrapRef} className="flex-1 min-w-0 overflow-hidden" style={{ height: CSS_H_PX }}>
      {/* canvas width/height attrs controlled by ResizeObserver; CSS uses 100% to fill wrapper */}
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: CSS_H_PX }} />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
const PLACEHOLDERS = {
  general: "Ask anything: regulatory strategy, industry news, writing, research, or general questions...",
  programNoProject: "Ask about regulatory strategy, industry guidance, health authority expectations, or program-specific work...",
  programWithProject: "Ask about this program's documents, risks, gaps, or health authority strategy...",
};

export function ChatInputBar({ value, onChange, onSend, onFileUpload, disabled, chatMode = "program", hasProgram = false }: ChatInputBarProps) {
  const defaultPlaceholder =
    chatMode === "general"
      ? PLACEHOLDERS.general
      : hasProgram
      ? PLACEHOLDERS.programWithProject
      : PLACEHOLDERS.programNoProject;
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => () => {
    mediaRecRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
  }, []);

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_CONTENT_H) + "px";
    el.style.overflowY = el.scrollHeight > MAX_CONTENT_H ? "auto" : "hidden";
  }, []);

  useEffect(() => { adjustHeight(); }, [value, adjustHeight]);

  // ── Recording ──────────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    setRecordingError(null);
    cancelledRef.current = false;
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setRecordingError("Microphone access denied.");
      return;
    }

    streamRef.current = stream;
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]
      .find(t => MediaRecorder.isTypeSupported(t)) ?? "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
    mediaRecRef.current = rec;

    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = async () => {
      stopStream();
      if (cancelledRef.current) { setIsRecording(false); return; }

      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
      console.log("[Voice] blob:", blob.size, "bytes,", blob.type);

      if (blob.size < 1000) {
        setRecordingError("No audio captured. Please try again.");
        setIsRecording(false);
        return;
      }

      setIsTranscribing(true);
      setIsRecording(false);
      try {
        const text = await chatApi.transcribeAudio(blob);
        console.log("[Voice] transcript:", JSON.stringify(text));
        if (text?.trim()) onChange(prev => prev ? `${prev} ${text.trim()}` : text.trim());
        else setRecordingError("No speech detected. Please try again.");
      } catch (err) {
        console.error("[Voice] error:", err);
        setRecordingError("Transcription failed. Check your OpenAI API key.");
      } finally {
        setIsTranscribing(false);
      }
    };

    rec.start(100);
    console.log("[Voice] started, mimeType:", rec.mimeType);
    setIsRecording(true);
  }, [onChange, stopStream]);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    mediaRecRef.current?.stop();
    setIsRecording(false);
    setRecordingError(null);
  }, []);

  const confirmRecording = useCallback(() => {
    cancelledRef.current = false;
    mediaRecRef.current?.stop();
  }, []);

  // ── File / send ────────────────────────────────────────────────────────────
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length) setPendingFiles(prev => [...prev, ...selected]);
    e.target.value = "";
  };

  const handleSend = useCallback(async () => {
    if (isUploading) return;
    if (pendingFiles.length > 0 && onFileUpload) {
      const fs = pendingFiles, t = value.trim() || undefined;
      setPendingFiles([]); onChange(""); setIsUploading(true);
      try { await onFileUpload(fs, t); } finally { setIsUploading(false); }
    } else {
      onSend();
    }
  }, [isUploading, pendingFiles, onFileUpload, value, onSend, onChange]);

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isBusy = disabled || isUploading || isTranscribing;
  const canSend = !isBusy && (!!value.trim() || pendingFiles.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="border-t border-gs-border bg-gs-bg pt-3 pb-4">

      {/* File chips — one per pending file */}
      {pendingFiles.length > 0 && !isRecording && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pendingFiles.map((f, i) => {
            const isZip = f.name.toLowerCase().endsWith(".zip");
            return (
              <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gs-card border border-gs-blue/30 rounded-lg text-xs text-gs-text max-w-xs">
                {isZip ? <Archive size={13} className="text-gs-blue shrink-0" /> : <FileText size={13} className="text-gs-blue shrink-0" />}
                <span className="truncate font-medium">{f.name}</span>
                <span className="text-gs-muted shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                {isZip && <span className="text-[10px] font-bold text-gs-blue bg-blue-50 px-1.5 py-0.5 rounded shrink-0">ZIP</span>}
                <button onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-gs-muted hover:text-red-500 transition-colors shrink-0 ml-1"><X size={13} /></button>
              </div>
            );
          })}
        </div>
      )}

      {/* Recording row */}
      {isRecording ? (
        <div className="flex items-center gap-2 bg-gs-card border border-blue-300 rounded-3xl px-4 py-3 overflow-hidden">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <Waveform analyserRef={analyserRef} />
          <button onClick={cancelRecording} className="p-1 text-slate-300 hover:text-red-400 rounded-full transition-colors shrink-0" aria-label="Cancel">
            <X size={15} />
          </button>
          <button onClick={confirmRecording} className="flex items-center justify-center w-8 h-8 bg-gs-blue hover:bg-gs-deep-blue text-white rounded-full transition-colors shrink-0" aria-label="Done">
            <Check size={15} />
          </button>
        </div>

      ) : isTranscribing ? (
        <div className="flex items-center gap-3 bg-gs-card border border-gs-border rounded-3xl px-4 py-3">
          <Loader2 size={18} className="text-blue-500 animate-spin shrink-0" />
          <span className="text-sm text-gs-muted font-medium">Transcribing…</span>
        </div>

      ) : (
        /* Normal input — flex wrapper holds border/bg; items-end keeps icons at bottom as textarea grows */
        <div className="flex flex-col gap-1.5">
          {recordingError && <p className="text-xs text-red-500 px-1">{recordingError}</p>}

          <input ref={fileInputRef} type="file" accept={ACCEPTED} multiple className="hidden" onChange={handleFileChange} />

          <div className={`flex items-end gap-2 bg-gs-card border rounded-3xl px-3 py-2.5 transition-colors ${isBusy ? "opacity-70" : "border-gs-border focus-within:border-blue-300"}`}>

            {/* Attach */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="shrink-0 p-1.5 mb-0.5 text-gs-muted hover:text-gs-blue hover:bg-slate-100 rounded-lg transition-colors disabled:cursor-not-allowed"
              title="Attach file"
            >
              <Plus size={18} />
            </button>

            {/* Textarea — no border, transparent background */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => { onChange(e.target.value); adjustHeight(); }}
              onKeyDown={handleKey}
              rows={1}
              disabled={isBusy}
              placeholder={pendingFiles.length > 0 ? "Add a message or just send the files…" : defaultPlaceholder}
              style={{ minHeight: LINE_H, maxHeight: MAX_CONTENT_H, overflowY: "hidden" }}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gs-text placeholder:text-gs-muted leading-5 py-2 disabled:cursor-not-allowed"
            />

            {/* Mic + Send */}
            <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
              <button
                onClick={startRecording}
                disabled={isBusy}
                className="p-1.5 text-gs-muted hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:cursor-not-allowed"
                title="Voice to text"
              >
                <Mic size={18} />
              </button>
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  canSend
                    ? "bg-gs-blue hover:bg-gs-deep-blue text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
                aria-label={isUploading ? "Uploading…" : "Send"}
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-gs-muted mt-2.5">
        Gulfstream Intelligence can make mistakes. Consider verifying important information.
      </p>
    </div>
  );
}
