"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  MoreHorizontal, ChevronLeft, ChevronRight, ExternalLink, Trash2,
} from "lucide-react";
import type { Conversation, User } from "../../types";

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
      user:           { name: creatorName, initials: getInitials(creatorName), color: isCreator ? "bg-blue-600" : "bg-slate-500" },
      timestamp:      formatTimestamp(convo.updated_at),
      icon:           <MessageSquare size={16} />,
      iconBg:         "bg-purple-50",
      iconColor:      "text-purple-600",
      canDelete,
    };
  });
}

interface ActivityTableProps {
  activities?: ActivityItem[];
  onDeleteChat?: (id: string) => void;
}

type MenuState = { key: string; item: ActivityItem; top: number; right: number } | null;

export function ActivityTable({ activities, onDeleteChat }: ActivityTableProps) {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuState>(null);

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
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-[#FAFBFF] border-b border-slate-100">
            <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Activity</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">Project / Context</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Date &amp; Time</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {activities?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-sm font-medium text-slate-400">
                  No activities match your filters.
                </td>
              </tr>
            ) : (
              activities?.map((item) => {
                return (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className={`hover:bg-slate-50 transition-colors group ${item.conversationId ? "cursor-pointer" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}>
                          {item.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 leading-tight">{item.type}</span>
                          <span className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5">{item.action}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-[300px] line-clamp-2">{item.details}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-400">{item.project}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${item.user.color} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm`}>
                          {item.user.initials}
                        </div>
                        <span className="text-sm font-bold text-slate-600 whitespace-nowrap">{item.user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[12px] font-bold text-slate-500 leading-tight whitespace-pre-line">{item.timestamp}</p>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => openMenu(e, item)}
                        className="text-slate-300 hover:text-slate-500 transition-colors"
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
      <div className="px-6 py-4 bg-white border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">
          Showing {activities?.length} {activities?.length === 1 ? "activity" : "activities"}
        </p>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50">
            <ChevronLeft size={16} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-blue-600 bg-blue-50 text-blue-600 text-sm font-bold">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Fixed-position dropdown — escapes overflow-x-auto clipping */}
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-white border border-slate-100 shadow-xl rounded-lg py-1 w-40"
            style={{ top: menu.top, right: menu.right }}
          >
            {menu.item.conversationId && (
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => { setMenu(null); router.push(`/dashboard/chat?conversation=${menu.item.conversationId}`); }}
              >
                <ExternalLink size={14} /> View Chat
              </button>
            )}
            {menu.item.conversationId && onDeleteChat && menu.item.canDelete && (
              <>
                <div className="border-t border-slate-100 my-1" />
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
