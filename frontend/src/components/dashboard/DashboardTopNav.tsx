"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Menu, ChevronRight, LogOut, Check, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { notificationApi } from "../../lib/api";
import type { AppNotification } from "../../types";

interface DashboardTopNavProps {
  onMenuClick?: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":                 "Home",
  "/dashboard/chat":            "Regulatory Chat",
  "/dashboard/gap-assessment":  "Global Gap Assessment",
  "/dashboard/ha-simulation":   "Health Authority Simulation",
  "/dashboard/documents":       "Document Intelligence",
  "/dashboard/projects":        "Projects",
  "/dashboard/history":         "History",
  "/dashboard/reports":         "Reports",
  "/dashboard/settings":        "Settings",
};

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const label = ROUTE_LABELS[pathname];
  const isHome = pathname === "/dashboard";

  return (
    <nav className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
      <Link href="/dashboard" className="text-gs-muted hover:text-gs-text transition-colors">
        Home
      </Link>
      {!isHome && label && (
        <>
          <ChevronRight className="w-3 h-3 text-gs-muted" />
          <span className="text-gs-text">{label}</span>
        </>
      )}
    </nav>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getResourceUrl(type: string | null, id: string | null): string | null {
  if (!type || !id) return null;
  if (type === "project") return `/dashboard/projects/${id}`;
  if (type === "conversation") return `/dashboard/chat?conversation=${id}`;
  return null;
}

export function DashboardTopNav({ onMenuClick }: DashboardTopNavProps) {
  const [regionOpen, setRegionOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const prevUnreadRef = useRef<number | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { count } = await notificationApi.unreadCount();
      const prev = prevUnreadRef.current;
      prevUnreadRef.current = count;
      setUnreadCount(count);
      // Only scan for new export_ready notifications when the count has increased.
      if (prev !== null && count > prev) {
        const notifs = await notificationApi.list(20);
        notifs
          .filter(n => n.type === "export_ready" && !n.is_read && n.resource_id)
          .forEach(n => {
            window.dispatchEvent(
              new CustomEvent("gi:export_ready", { detail: { conversationId: n.resource_id } })
            );
          });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  async function openNotifications() {
    if (notifOpen) { setNotifOpen(false); return; }
    setNotifOpen(true);
    setNotifLoading(true);
    try {
      const data = await notificationApi.list(20);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
      data
        .filter(n => n.type === "export_ready" && !n.is_read && n.resource_id)
        .forEach(n => {
          window.dispatchEvent(
            new CustomEvent("gi:export_ready", { detail: { conversationId: n.resource_id } })
          );
        });
    } catch { /* ignore */ }
    finally { setNotifLoading(false); }
  }

  async function handleMarkAllRead() {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }

  async function handleNotifClick(n: AppNotification) {
    if (!n.is_read) {
      try {
        await notificationApi.markRead(n.id);
        setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch { /* ignore */ }
    }
    const url = getResourceUrl(n.resource_type, n.resource_id);
    if (url) { setNotifOpen(false); router.push(url); }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user ? getInitials(user.full_name, user.email) : "…";

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 h-16 bg-gs-card border-b border-gs-border">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gs-muted hover:text-gs-text hover:bg-gs-bg transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb — desktop only */}
      <Breadcrumb pathname={pathname} />

      {/* Right controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Region selector */}
        <div className="relative">
          {regionOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-gs-card border border-gs-border rounded-xl shadow-card-hover z-20">
              {["Global", "FDA", "EMA", "MHRA", "PMDA"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRegionOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gs-text hover:bg-gs-bg transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifications}
            className="relative p-2 rounded-lg text-gs-muted hover:text-gs-text hover:bg-gs-bg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-gs-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-1 w-80 bg-gs-card border border-gs-border rounded-xl shadow-card-hover z-20 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gs-border">
                <h4 className="text-[13px] font-bold text-gs-text">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-gs-blue hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-gs-border">
                {notifLoading ? (
                  <div className="px-4 py-6 text-center text-[12px] text-gs-muted">Loading…</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[12px] text-gs-muted">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-gs-bg transition-colors ${!n.is_read ? "bg-gs-blue/5" : ""}`}
                    >
                      <div className="flex items-start gap-2.5">
                        {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-gs-blue mt-1.5 shrink-0" />}
                        <div className={`flex-1 min-w-0 ${n.is_read ? "pl-4" : ""}`}>
                          <p className="text-[12px] font-bold text-gs-text truncate">{n.title}</p>
                          {n.body && <p className="text-[11px] text-gs-muted mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-[10px] text-gs-muted mt-1 font-medium uppercase tracking-wide">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-gs-border px-4 py-2.5">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-gs-blue hover:underline"
                >
                  <Settings className="w-3.5 h-3.5" /> View all activity
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User avatar + dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gs-bg transition-colors min-h-[44px]"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-gs-blue flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gs-muted hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-gs-card border border-gs-border rounded-xl shadow-card-hover z-20 overflow-hidden">
              <button
                onClick={() => { setUserMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gs-red hover:bg-gs-red/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
