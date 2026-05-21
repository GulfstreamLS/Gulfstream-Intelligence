"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { ToggleRow } from "./SettingsPrimitives";
import { authApi, organizationApi } from "../../lib/api";
import { useChatStore } from "../../store/chatStore";

export function NotificationsView() {
  const user = useChatStore((s) => s.user);
  const setUser = useChatStore((s) => s.setUser);
  const [isOwner, setIsOwner] = useState(false);
  const [highPriorityAlerts, setHighPriorityAlerts] = useState(user?.preferences?.high_priority_alerts ?? true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isOrgMember = user?.account_type === "organization_member";

  useEffect(() => {
    setHighPriorityAlerts(user?.preferences?.high_priority_alerts ?? true);
  }, [user?.preferences?.high_priority_alerts]);

  useEffect(() => {
    if (!isOrgMember || !user) {
      setIsOwner(false);
      return;
    }
    organizationApi.get()
      .then((org) => setIsOwner(org.owner_id === user.id))
      .catch(() => setIsOwner(false));
  }, [isOrgMember, user]);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const updated = await authApi.updateProfile({ preferences: { high_priority_alerts: highPriorityAlerts } });
      setUser(updated);
      setMsg({ ok: true, text: "Notification settings saved." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  if (!isOrgMember || !isOwner) {
    return (
      <div className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card max-w-[100%]">
        <h3 className="text-[18px] font-bold text-gs-text mb-3">Notification Settings</h3>
        <p className="text-[13px] text-gs-muted">
          Notification preferences are managed by the organization owner.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card max-w-[100%]">
      <h3 className="text-[18px] font-bold text-gs-text mb-6">Notification Settings</h3>

      {msg && (
        <div className={`flex items-center gap-3 px-4 py-3 mb-6 rounded-xl text-sm font-medium border ${
          msg.ok ? "bg-gs-green/10 border-gs-green/20 text-gs-green" : "bg-gs-red/10 border-gs-red/20 text-gs-red"
        }`}>
          {msg.ok ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <ToggleRow
        title="Critical Gap Owner Alerts"
        desc="Email and in-app alerts when an organization member's analysis identifies critical regulatory gaps."
        enabled={highPriorityAlerts}
        onChange={setHighPriorityAlerts}
      />

      <div className="mt-12 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-2.5 disabled:opacity-60">
          {saving ? "Saving…" : "Save Notification Settings"}
        </button>
      </div>
    </div>
  );
}
