"use client";

import { useState } from "react";
import { Monitor, Lock, ShieldCheck, Smartphone, Fingerprint, AlertTriangle } from "lucide-react";
import { authApi } from "../../lib/api";

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
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Access Control */}
      <section className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card">
        <h3 className="text-[18px] font-bold text-gs-text mb-6">Access Control</h3>
        <div className="space-y-6">
          <div className="p-5 border border-gs-border rounded-xl bg-gs-bg flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Smartphone className="text-gs-blue w-5 h-5 shrink-0" />
              <div>
                <p className="text-[14px] font-bold text-gs-text">Multi-Factor Authentication (MFA)</p>
                <p className="text-[12px] text-gs-muted">Add an extra layer of security to your account.</p>
              </div>
            </div>
            <span className="bg-green-100 text-green-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase shrink-0">
              Enabled
            </span>
          </div>
          <div className="p-5 border border-gs-border rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Fingerprint className="text-gs-muted w-5 h-5 shrink-0" />
              <div>
                <p className="text-[14px] font-bold text-gs-text">Biometric Authentication</p>
                <p className="text-[12px] text-gs-muted">Unlock using Windows Hello or Apple Touch ID.</p>
              </div>
            </div>
            <button className="text-[13px] font-bold text-gs-blue hover:underline shrink-0">Set Up</button>
          </div>
        </div>

        {/* Password Management */}
        <div className="mt-10">
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
          <SecurityActivityItem
            icon={<Monitor className="w-[18px] h-[18px]" />}
            title="New Login Detected"
            desc="Chrome on Windows (New York, US)"
            time="10 mins ago"
          />
          <SecurityActivityItem
            icon={<Lock className="w-[18px] h-[18px]" />}
            title="Password Changed"
            desc="Successful update of system password."
            time="2 days ago"
          />
          <SecurityActivityItem
            icon={<ShieldCheck className="w-[18px] h-[18px]" />}
            title="MFA Verification"
            desc="Verified via Google Authenticator app."
            time="3 days ago"
          />

          {/* Danger Zone */}
          <div className="pt-8 mt-6 border-t border-gs-border">
            <h4 className="text-[14px] font-bold text-gs-red mb-3 flex items-center gap-2">
              <AlertTriangle className="w-[18px] h-[18px]" /> Danger Zone
            </h4>
            <p className="text-[12px] text-gs-muted mb-4">
              Permanently delete your account and all associated document data.
            </p>
            <button className="border border-gs-red text-gs-red px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
