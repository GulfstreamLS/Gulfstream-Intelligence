"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search, Download, Clock, History,
  LogIn, User, Lock, FolderPlus, FolderPen, Trash2,
  Stethoscope, Globe, FileText, MessageSquare, Loader2,
} from "lucide-react";
import { authApi } from "../../lib/api";
import type { AuditLog } from "../../types";

const PAGE = 20;

/* ── Action display config ──────────────────────────────────────── */
const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  LOGIN:              { label: "User Login",          icon: <LogIn      className="w-3.5 h-3.5" />, color: "text-gs-blue" },
  PROFILE_UPDATED:    { label: "Profile Updated",     icon: <User       className="w-3.5 h-3.5" />, color: "text-purple-500" },
  PASSWORD_CHANGED:   { label: "Password Changed",    icon: <Lock       className="w-3.5 h-3.5" />, color: "text-amber-500" },
  PROJECT_CREATED:    { label: "Project Created",     icon: <FolderPlus className="w-3.5 h-3.5" />, color: "text-gs-green" },
  PROJECT_UPDATED:    { label: "Project Updated",     icon: <FolderPen  className="w-3.5 h-3.5" />, color: "text-indigo-500" },
  PROJECT_DELETED:    { label: "Project Deleted",     icon: <Trash2     className="w-3.5 h-3.5" />, color: "text-gs-red" },
  SIMULATION_RUN:     { label: "Simulation Run",      icon: <Stethoscope className="w-3.5 h-3.5" />, color: "text-teal-500" },
  GAP_ASSESSMENT_RUN: { label: "Gap Analysis Run",   icon: <Globe      className="w-3.5 h-3.5" />, color: "text-cyan-500" },
  DOCUMENT_UPLOADED:  { label: "Document Uploaded",  icon: <FileText   className="w-3.5 h-3.5" />, color: "text-orange-500" },
  CHAT_CREATED:       { label: "Chat Created",        icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-sky-500" },
  CHAT_DELETED:       { label: "Chat Deleted",        icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-rose-400" },
};

function getMeta(action: string) {
  return ACTION_META[action] ?? { label: action, icon: <Clock className="w-3.5 h-3.5" />, color: "text-gs-muted" };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
}

function AuditRow({ log }: { log: AuditLog }) {
  const meta = getMeta(log.action);
  const userName = log.user_full_name || log.user_email || "—";
  return (
    <tr className="hover:bg-gs-bg transition-colors">
      <td className="px-8 py-5 font-bold text-gs-muted">
        <span className="flex items-center gap-2 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" /> {formatTime(log.created_at)}
        </span>
      </td>
      <td className="px-8 py-5 font-bold text-gs-text whitespace-nowrap">{userName}</td>
      <td className="px-8 py-5">
        <span className={`flex items-center gap-1.5 font-bold whitespace-nowrap ${meta.color}`}>
          {meta.icon} {meta.label}
        </span>
      </td>
      <td className="px-8 py-5 text-gs-muted font-medium max-w-[200px] truncate">
        {log.resource_name ?? log.resource_type ?? "—"}
      </td>
      <td className="px-8 py-5 text-right font-medium text-gs-muted whitespace-nowrap">
        {log.ip_address ?? "—"}
      </td>
    </tr>
  );
}

export function AuditLogView() {
  const [logs, setLogs]       = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch]   = useState("");
  const [offset, setOffset]   = useState(0);

  const fetchLogs = useCallback(async (newOffset: number, replace: boolean) => {
    if (newOffset === 0) setLoading(true); else setLoadingMore(true);
    try {
      const data = await authApi.getActivity(PAGE, newOffset);
      setLogs(prev => replace ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE);
      setOffset(newOffset + data.length);
    } catch {
      // silently fail — keep existing data
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchLogs(0, true); }, [fetchLogs]);

  const filtered = search.trim()
    ? logs.filter(l => {
        const q = search.toLowerCase();
        return (
          getMeta(l.action).label.toLowerCase().includes(q) ||
          (l.resource_name ?? "").toLowerCase().includes(q) ||
          (l.ip_address ?? "").toLowerCase().includes(q)
        );
      })
    : logs;

  function downloadCSV() {
    const header = "Timestamp,Action,Resource,IP Address\n";
    const rows = filtered.map(l =>
      `"${formatTime(l.created_at)}","${getMeta(l.action).label}","${l.resource_name ?? l.resource_type ?? ""}","${l.ip_address ?? ""}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit-log.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-gs-card rounded-xl border border-gs-border shadow-card overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-gs-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gs-bg">
        <div>
          <h3 className="text-[18px] font-bold text-gs-text mb-1">System Audit Log</h3>
          <p className="text-[13px] text-gs-muted">
            Transparent history of all system changes and document actions.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gs-muted w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="h-10 pl-10 pr-4 border border-gs-border rounded-lg text-[13px] w-[200px] bg-gs-card text-gs-text focus:outline-none focus:border-gs-blue"
            />
          </div>
          <button
            onClick={downloadCSV}
            className="h-10 px-4 border border-gs-border rounded-lg bg-gs-card text-[13px] font-bold text-gs-muted flex items-center gap-2 hover:text-gs-text transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gs-bg text-[11px] font-bold text-gs-muted uppercase tracking-widest border-b border-gs-border">
            <tr>
              <th className="px-8 py-4">Timestamp</th>
              <th className="px-8 py-4">User</th>
              <th className="px-8 py-4">Action</th>
              <th className="px-8 py-4">Resource</th>
              <th className="px-8 py-4 text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gs-border text-[13px]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gs-muted mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center text-[13px] font-bold text-gs-muted">
                  {search ? "No matching log entries." : "No activity recorded yet."}
                </td>
              </tr>
            ) : (
              filtered.map(log => <AuditRow key={log.id} log={log} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {hasMore && !search && (
        <div className="p-4 bg-gs-bg text-center border-t border-gs-border">
          <button
            onClick={() => fetchLogs(offset, false)}
            disabled={loadingMore}
            className="text-[13px] font-bold text-gs-blue flex items-center justify-center gap-2 w-full hover:underline disabled:opacity-60"
          >
            {loadingMore
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
              : <><History className="w-4 h-4" /> Load More History</>}
          </button>
        </div>
      )}
    </div>
  );
}
