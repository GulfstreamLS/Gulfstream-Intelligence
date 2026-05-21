"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Lock, ShieldCheck, AlertTriangle, MailCheck, Trash2, X } from "lucide-react";
import { authApi, clearTokenCookies } from "../../lib/api";
import { useChatStore } from "../../store/chatStore";
import type { AuditLog } from "../../types";

interface ActivityItemProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  time: string;
}

function SecurityActivityItem({ icon, title, desc, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 text-gs-muted shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between gap-4">
          <p className="text-[13px] font-bold text-gs-text">{title}</p>
          <span className="text-[11px] font-bold text-gs-muted uppercase shrink-0">{time}</span>
        </div>
        <p className="text-[12px] text-gs-muted mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export function SecurityView() {
  const router = useRouter();
  const user = useChatStore((s) => s.user);
  const setUser = useChatStore((s) => s.setUser);
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null);
  const [verifySent, setVerifySent] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    authApi.getActivity(8, 0)
      .then((logs) => setActivity(logs.filter((log) => ["LOGIN", "PASSWORD_CHANGED", "PROFILE_UPDATED"].includes(log.action)).slice(0, 3)))
      .catch(() => setActivity([]))
      .finally(() => setActivityLoading(false));
  }, []);

  async function handleDeleteAccount() {
    setDeleteError("");
    if (deleteConfirm !== "DELETE") {
      setDeleteError("Type DELETE to confirm account deletion.");
      return;
    }
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm account deletion.");
      return;
    }
    setDeleteLoading(true);
    try {
      await authApi.deleteAccount(deletePassword);
      clearTokenCookies();
      setUser(null);
      router.replace("/login");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Account deletion failed.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function securityMeta(log: AuditLog) {
    if (log.action === "LOGIN") {
      return { icon: <Monitor className="w-[18px] h-[18px]" />, title: "Login", desc: log.ip_address ? `IP address ${log.ip_address}` : "Successful account login" };
    }
    if (log.action === "PASSWORD_CHANGED") {
      return { icon: <Lock className="w-[18px] h-[18px]" />, title: "Password Changed", desc: "Account password was updated." };
    }
    return { icon: <ShieldCheck className="w-[18px] h-[18px]" />, title: "Profile Updated", desc: "Account profile or preferences changed." };
  }

  function formatRelative(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.max(0, Math.floor(diff / 60000));
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  async function handlePasswordUpdate() {
    if (!current || !next) {
      setMsg({ ok: false, text: "Please fill in both password fields." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await authApi.updatePassword(current, next);
      setCurrent("");
      setNext("");
      setMsg({ ok: true, text: "Password updated successfully." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Update failed." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendVerification() {
    setVerifyLoading(true);
    try {
      await authApi.resendVerification();
      setVerifySent(true);
    } catch { /* ignore */ }
    finally { setVerifyLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Email verification banner for unverified users */}
      {user && !user.is_verified && (
        <div className="lg:col-span-2 flex items-start gap-4 p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl">
          <MailCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Email not verified</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Verify your email address to secure your account and receive important notifications.
            </p>
          </div>
          {verifySent ? (
            <span className="text-xs font-medium text-gs-green shrink-0">Code sent!</span>
          ) : (
            <button
              onClick={handleSendVerification}
              disabled={verifyLoading}
              className="text-xs font-bold text-amber-700 dark:text-amber-300 underline shrink-0 disabled:opacity-50"
            >
              {verifyLoading ? "Sending…" : "Verify now"}
            </button>
          )}
        </div>
      )}

      {/* Access Control */}
      <section className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card">
        <h3 className="text-[18px] font-bold text-gs-text mb-6">Access Control</h3>

        {/* Password Management */}
        <div>
          <h4 className="text-[14px] font-bold text-gs-text mb-4">Password Management</h4>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">
                Current Password
              </label>
              <input
                type="password"
                value={current}
                onChange={e => { setCurrent(e.target.value); setMsg(null); }}
                placeholder="••••••••••••"
                className="h-11 px-4 border border-gs-border rounded-lg bg-gs-bg text-gs-text focus:outline-none focus:border-gs-blue"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                value={next}
                onChange={e => { setNext(e.target.value); setMsg(null); }}
                placeholder="••••••••••••"
                className="h-11 px-4 border border-gs-border rounded-lg bg-gs-card text-gs-text focus:outline-none focus:border-gs-blue"
              />
            </div>
            {msg && (
              <p className={`text-[13px] font-bold ${msg.ok ? "text-gs-green" : "text-gs-red"}`}>
                {msg.text}
              </p>
            )}
            <button
              onClick={handlePasswordUpdate}
              disabled={saving}
              className="btn-primary w-full py-2.5 mt-2 disabled:opacity-60"
            >
              {saving ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>
      </section>

      {/* Recent Security Activity */}
      <section className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card">
        <h3 className="text-[18px] font-bold text-gs-text mb-6">Recent Security Activity</h3>
        <div className="space-y-5">
          {activityLoading ? (
            <p className="text-[13px] text-gs-muted font-medium">Loading activity...</p>
          ) : activity.length === 0 ? (
            <p className="text-[13px] text-gs-muted font-medium">No recent security activity recorded.</p>
          ) : activity.map((log) => {
            const meta = securityMeta(log);
            return (
              <SecurityActivityItem
                key={log.id}
                icon={meta.icon}
                title={meta.title}
                desc={meta.desc}
                time={formatRelative(log.created_at)}
              />
            );
          })}

          {/* Danger Zone */}
          <div className="pt-8 mt-6 border-t border-gs-border">
            <h4 className="text-[14px] font-bold text-gs-red mb-3 flex items-center gap-2">
              <AlertTriangle className="w-[18px] h-[18px]" /> Danger Zone
            </h4>
            <p className="text-[12px] text-gs-muted mb-4">
              Permanently delete your account and all associated document data.
            </p>
            <button
              onClick={() => { setDeleteOpen(true); setDeletePassword(""); setDeleteConfirm(""); setDeleteError(""); }}
              className="border border-gs-red text-gs-red px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </section>

      {deleteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4" onClick={() => setDeleteOpen(false)}>
          <div className="bg-gs-card border border-gs-border rounded-2xl p-8 max-w-sm w-full shadow-card-hover space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gs-red flex items-center gap-2"><Trash2 className="w-5 h-5" /> Delete Account</h3>
                <p className="text-sm text-gs-muted mt-2">
                  This permanently deletes your account and associated personal data. This cannot be recovered.
                </p>
              </div>
              <button onClick={() => setDeleteOpen(false)} className="text-gs-muted hover:text-gs-text"><X className="w-5 h-5" /></button>
            </div>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Current password"
              className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-red"
            />
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-red"
            />
            {deleteError && <p className="text-sm text-gs-red">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteOpen(false)} className="flex-1 border border-gs-border rounded-button py-2.5 text-sm font-medium text-gs-text hover:bg-gs-bg">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleteLoading} className="flex-1 bg-gs-red hover:bg-red-700 text-white rounded-button py-2.5 text-sm font-bold disabled:opacity-50">
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
