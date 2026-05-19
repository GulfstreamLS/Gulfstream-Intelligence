"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  MoreHorizontal, ChevronLeft, ChevronRight, ExternalLink, Trash2, X,
} from "lucide-react";
import type { Conversation, User } from "../../types";
import { getChatModelLabel } from "../../lib/chatModels";

export interface ActivityItem {
  id: string | number;
  type: string;
  action: string;
  details: string;
  project: string;
  user: { name: string; initials: string; color: string };
  timestamp: string;
  rawDate?: string;        // ISO string — used for date filtering
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  conversationId?: string;
  canDelete?: boolean;
  chatMode?: string | null;
  models?: string[];
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${date}\n${time}`;
}

export function mapConversationsToActivities(
  conversations: Conversation[],
  user: User | null,
  isOrgOwner = false,
): ActivityItem[] {
  return conversations.map(convo => {
    const lastMsg        = convo.messages?.[convo.messages.length - 1];
    const firstUserMsg   = convo.messages?.find(m => m.role === "user");
    const msgCount       = convo.messages?.length ?? 0;

    const details =
      convo.title ??
      firstUserMsg?.content?.slice(0, 120) ??
      "New conversation";

    const action =
      msgCount === 0           ? "Conversation started"  :
      msgCount === 1           ? "Question asked"        :
      lastMsg?.role === "user" ? "Follow-up question"    :
                                 "Conversation";

    const creatorName = convo.user_full_name ?? convo.user_email ?? (convo.user_id === user?.id ? (user?.full_name ?? user?.email ?? "You") : "Team Member");
    const isCreator = convo.user_id === user?.id;
    const canDelete = isCreator || isOrgOwner;

    return {
      id:             convo.id,
      conversationId: convo.id,
      type:           "Regulatory Chat",
      action,
      details,
      project:        convo.project_name ?? "—",
      rawDate:        convo.updated_at,
      user:           { name: creatorName, initials: getInitials(creatorName), color: isCreator ? "bg-blue-600" : "bg-gs-muted" },
      timestamp:      formatTimestamp(convo.updated_at),
      icon:           <MessageSquare size={16} />,
      iconBg:         "bg-purple-50",
      iconColor:      "text-purple-600",
      canDelete,
      chatMode:       convo.chat_mode,
      models:         convo.models_used?.length ? convo.models_used : (convo.model ? [convo.model] : []),
    };
  });
}

interface ActivityTableProps {
  activities?: ActivityItem[];
  onDeleteChat?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

type MenuState = { key: string; item: ActivityItem; top: number; right: number } | null;

export function ActivityTable({ activities, onDeleteChat, onBulkDelete, page = 1, totalPages = 1, totalCount, onPageChange }: ActivityTableProps) {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuState>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const deletableIds = (activities ?? [])
    .filter(a => a.canDelete && a.conversationId)
    .map(a => a.conversationId!);

  // Remove stale selections when deleted conversations leave the list
  useEffect(() => {
    setSelected(prev => {
      const valid = new Set(deletableIds);
      const next = new Set([...prev].filter(id => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [deletableIds]);

  const allSelected = deletableIds.length > 0 && deletableIds.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(deletableIds));
    }
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (!onBulkDelete || selected.size === 0) return;
    onBulkDelete(Array.from(selected));
  };

  const handleRowClick = (item: ActivityItem) => {
    if (item.conversationId) router.push(`/dashboard/chat?conversation=${item.conversationId}`);
  };

  function openMenu(e: React.MouseEvent<HTMLButtonElement>, item: ActivityItem) {
    const key = String(item.id);
    if (menu?.key === key) { setMenu(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ key, item, top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }

  return (
    <div className="bg-gs-card rounded-xl border border-gs-border shadow-sm overflow-hidden">

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center justify-between px-6 py-3 bg-gs-blue/5 border-b border-gs-blue/20">
          <span className="text-sm font-semibold text-gs-text">
            {selected.size} {selected.size === 1 ? "chat" : "chats"} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
            >
              <Trash2 size={13} /> Delete {selected.size} selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="flex items-center gap-1 px-2 py-1.5 text-gs-muted hover:text-gs-text rounded-lg text-xs font-semibold transition-colors"
            >
              <X size={13} /> Clear
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-gs-bg border-b border-gs-border">
            <tr className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">
              <th className="pl-6 pr-3 py-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = selected.size > 0 && !allSelected; }}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gs-border accent-gs-blue cursor-pointer"
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-4">Activity</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">Mode</th>
              <th className="px-6 py-4">Model</th>
              <th className="px-6 py-4">Project / Context</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Date &amp; Time</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gs-border">
            {activities?.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-sm font-medium text-gs-muted">
                  No activities match your filters.
                </td>
              </tr>
            ) : (
              activities?.map((item) => {
                const isSelected = !!item.conversationId && selected.has(item.conversationId);
                const canSelect  = !!(item.canDelete && item.conversationId);
                const modeCls = item.chatMode === "general"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  : "bg-gs-blue/10 text-gs-blue";
                const modeLabel = item.chatMode === "general" ? "General" : item.chatMode === "program" ? "Program" : "—";
                return (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className={`transition-colors group ${item.conversationId ? "cursor-pointer" : ""} ${isSelected ? "bg-gs-blue/5" : "hover:bg-gs-bg"}`}
                  >
                    <td className="pl-6 pr-3 py-4 w-10" onClick={e => e.stopPropagation()}>
                      {canSelect && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(item.conversationId!)}
                          className="w-4 h-4 rounded border-gs-border accent-gs-blue cursor-pointer"
                          aria-label={`Select ${item.details}`}
                        />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}>
                          {item.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gs-text leading-tight">{item.type}</span>
                          <span className="text-[11px] font-medium text-gs-muted leading-tight mt-0.5">{item.action}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gs-muted leading-relaxed max-w-[300px] line-clamp-2">{item.details}</p>
                    </td>
                    <td className="px-6 py-4">
                      {item.chatMode ? (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${modeCls}`}>{modeLabel}</span>
                      ) : (
                        <span className="text-sm text-gs-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.models && item.models.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.models.map(m => (
                            <span key={m} className="text-[11px] font-medium text-gs-muted bg-gs-bg border border-gs-border px-2 py-0.5 rounded whitespace-nowrap">
                              {getChatModelLabel(m)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gs-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gs-muted">{item.project}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${item.user.color} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm`}>
                          {item.user.initials}
                        </div>
                        <span className="text-sm font-bold text-gs-muted whitespace-nowrap">{item.user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[12px] font-bold text-gs-muted leading-tight whitespace-pre-line">{item.timestamp}</p>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => openMenu(e, item)}
                        className="text-gs-muted hover:text-gs-muted transition-colors"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-gs-card border-t border-gs-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm font-medium text-gs-muted">
          {totalCount != null
            ? `Showing ${activities?.length ?? 0} of ${totalCount} ${totalCount === 1 ? "activity" : "activities"}`
            : `Showing ${activities?.length ?? 0} ${(activities?.length ?? 0) === 1 ? "activity" : "activities"}`}
        </p>
        {totalPages > 1 && onPageChange && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-gs-border text-gs-muted hover:bg-gs-bg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="w-8 text-center text-gs-muted text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-bold transition-colors ${
                      p === page
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600"
                        : "border-gs-border text-gs-muted hover:bg-gs-bg"
                    }`}
                  >
                    {p}
                  </button>
                )
              )
            }
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-gs-border text-gs-muted hover:bg-gs-bg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Fixed-position dropdown — escapes overflow-x-auto clipping */}
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-gs-card border border-gs-border shadow-xl rounded-lg py-1 w-40"
            style={{ top: menu.top, right: menu.right }}
          >
            {menu.item.conversationId && (
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gs-text hover:bg-gs-bg"
                onClick={() => { setMenu(null); router.push(`/dashboard/chat?conversation=${menu.item.conversationId}`); }}
              >
                <ExternalLink size={14} /> View Chat
              </button>
            )}
            {menu.item.conversationId && onDeleteChat && menu.item.canDelete && (
              <>
                <div className="border-t border-gs-border my-1" />
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => { setMenu(null); onDeleteChat(menu.item.conversationId!); }}
                >
                  <Trash2 size={14} /> Delete Chat
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
