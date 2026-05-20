"use client";

import { useRef, useState } from "react";
import { LifeBuoy, Send, CheckCircle, Mail, Paperclip, X } from "lucide-react";
import { supportApi } from "../../lib/api";
import { useChatStore } from "../../store/chatStore";

const SUPPORT_EMAIL = "contact@gulfstreamlifescience.com";
const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const ACCEPT = ".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.log,.zip,image/*";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SupportForm() {
  const user = useChatStore((s) => s.user);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const picked = Array.from(e.target.files ?? []);
    if (e.target) e.target.value = "";
    if (picked.length === 0) return;

    const next = [...files, ...picked];
    if (next.length > MAX_FILES) {
      setFileError(`You can attach at most ${MAX_FILES} files.`);
      return;
    }
    const total = next.reduce((sum, f) => sum + f.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      setFileError("Attachments exceed the 10 MB total limit.");
      return;
    }
    setFiles(next);
  }

  function removeFile(index: number) {
    setFileError("");
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await supportApi.submit({ subject: subject.trim(), message: message.trim(), files });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSubject("");
    setMessage("");
    setFiles([]);
    setFileError("");
    setSent(false);
    setError("");
  }

  const submitterName = user?.full_name || user?.email || "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 md:gap-8 items-start">
      {/* Left — info */}
      <div className="bg-gs-card border border-gs-border rounded-2xl p-6 md:p-8 space-y-5">
        <div className="w-11 h-11 rounded-xl bg-gs-blue/10 flex items-center justify-center text-gs-blue">
          <LifeBuoy className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gs-text">How can we help?</h3>
          <p className="text-[14px] text-gs-muted mt-1 leading-relaxed">
            Send us your question and our support team will follow up by email. We typically
            respond within one business day.
          </p>
        </div>
        <div className="pt-1 border-t border-gs-border">
          <p className="text-[11px] font-bold text-gs-muted uppercase tracking-wider mt-4 mb-1">
            Prefer email?
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-2 text-[14px] font-medium text-gs-blue hover:underline break-all"
          >
            <Mail className="w-4 h-4 shrink-0" />
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>

      {/* Right — form */}
      <div className="bg-gs-card border border-gs-border rounded-2xl p-6 md:p-8 shadow-card">
        {sent ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <CheckCircle className="w-14 h-14 text-gs-green" />
            <h3 className="text-xl font-bold text-gs-text">Request sent!</h3>
            <p className="text-sm text-gs-muted max-w-xs">
              Our support team will get back to you{user?.email ? <> at <strong className="text-gs-text">{user.email}</strong></> : ""} soon.
            </p>
            <button
              onClick={handleReset}
              className="text-sm font-bold text-gs-blue hover:underline mt-2"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-bold text-gs-text mb-1">Contact Support</h3>

            {submitterName && (
              <p className="text-[13px] text-gs-muted">
                Submitting as <strong className="text-gs-text">{submitterName}</strong>
              </p>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">
                Subject *
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your question"
                className="w-full px-3 py-2.5 border border-gs-border rounded-lg bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-blue placeholder:text-gs-muted"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">
                Message *
              </label>
              <textarea
                required
                rows={6}
                maxLength={5000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or issue in as much detail as possible…"
                className="w-full px-3 py-2.5 border border-gs-border rounded-lg bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-blue placeholder:text-gs-muted resize-none"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">
                Attachments
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT}
                onChange={handleFilesSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-gs-border rounded-lg bg-gs-bg text-gs-text text-sm font-semibold hover:bg-gs-card transition-colors min-h-[40px]"
              >
                <Paperclip className="w-4 h-4 text-gs-muted" />
                Attach files
              </button>
              <p className="text-[11px] text-gs-muted">
                Up to {MAX_FILES} files, 10 MB total. Images, PDFs, documents, and logs.
              </p>

              {files.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2 px-3 py-2 border border-gs-border rounded-lg bg-gs-bg"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-gs-muted shrink-0" />
                      <span className="flex-1 min-w-0 truncate text-[13px] text-gs-text">{f.name}</span>
                      <span className="text-[11px] text-gs-muted shrink-0">{formatBytes(f.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-gs-muted hover:text-gs-red transition-colors shrink-0"
                        aria-label={`Remove ${f.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {fileError && <p className="text-sm text-gs-red">{fileError}</p>}
            </div>

            {error && <p className="text-sm text-gs-red">{error}</p>}

            <button
              type="submit"
              disabled={loading || !subject.trim() || !message.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gs-blue hover:bg-gs-deep-blue text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-60 min-h-[44px]"
            >
              {loading ? "Sending…" : (
                <>
                  <Send className="w-4 h-4" />
                  Send Request
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
