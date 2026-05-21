"use client";

import { useState, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";
import { ToggleRow, GsSelect } from "./SettingsPrimitives";
import { useThemeStore } from "../../store/themeStore";
import { useChatStore } from "../../store/chatStore";
import { authApi, organizationApi } from "../../lib/api";
import { DEFAULT_WORKSPACE_OPTIONS } from "../../lib/defaultWorkspace";

interface Toast { type: "success" | "error"; message: string; }

function normalizeWorkspace(value?: string | null) {
  return DEFAULT_WORKSPACE_OPTIONS.find((option) => option.value === value || option.label === value)?.value ?? DEFAULT_WORKSPACE_OPTIONS[0].value;
}

export function PreferencesView() {
  const theme   = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const user    = useChatStore((s) => s.user);
  const setUser = useChatStore((s) => s.setUser);

  const prefs = user?.preferences;
  const isOrgMember = user?.account_type === "organization_member";

  const [highPriorityAlerts, setHighPriorityAlerts] = useState(prefs?.high_priority_alerts  ?? true);
  const [workspaceView,      setWorkspaceView]      = useState<string>(normalizeWorkspace(prefs?.default_workspace_view));
  const [isOwner,            setIsOwner]            = useState(false);
  const [saving,             setSaving]             = useState(false);
  const [toast,              setToast]              = useState<Toast | null>(null);

  useEffect(() => {
    if (!isOrgMember || !user) {
      setIsOwner(false);
      return;
    }
    organizationApi.get()
      .then((org) => setIsOwner(org.owner_id === user.id))
      .catch(() => setIsOwner(false));
  }, [isOrgMember, user]);

  const canSetOrgPreferences = isOrgMember && isOwner;
  const canSetDefaultView = !isOrgMember || isOwner;
  const hasSavedPreferences = canSetDefaultView || canSetOrgPreferences;

  // Sync from store when user loads (handles page refresh / first load)
  useEffect(() => {
    if (!user?.preferences) return;
    const p = user.preferences;
    if (p.high_priority_alerts !== undefined) setHighPriorityAlerts(p.high_priority_alerts);
    if (p.default_workspace_view)            setWorkspaceView(normalizeWorkspace(p.default_workspace_view));
  }, [user?.id, user?.preferences]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function persistDarkModePreference(enabled: boolean) {
    setTheme(enabled ? "dark" : "light");
    if (!user) return;

    const preferences = { ...(user.preferences ?? {}), dark_mode: enabled };
    setUser({ ...user, preferences });
    authApi.updateProfile({ preferences: { dark_mode: enabled } })
      .then((updated) => { if (updated) setUser(updated); })
      .catch(() => {});
  }

  function handleDarkModeToggle(enabled: boolean) {
    persistDarkModePreference(enabled);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const preferences = {
        ...(canSetOrgPreferences ? { high_priority_alerts: highPriorityAlerts } : {}),
        ...(canSetDefaultView ? { default_workspace_view: workspaceView } : {}),
      };
      const updated = await authApi.updateProfile({
        preferences,
      });
      if (updated) setUser(updated);
      setToast({ type: "success", message: "Preferences saved." });
    } catch (e) {
      setToast({ type: "error", message: e instanceof Error ? e.message : "Failed to save preferences." });
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    const resetHighPriority = true;
    const resetWorkspace = DEFAULT_WORKSPACE_OPTIONS[0].value;
    if (canSetOrgPreferences) setHighPriorityAlerts(resetHighPriority);
    if (canSetDefaultView) setWorkspaceView(resetWorkspace);
    setSaving(true);
    setToast(null);
    try {
      const updated = await authApi.updateProfile({
        preferences: {
          ...(canSetOrgPreferences ? { high_priority_alerts: resetHighPriority } : {}),
          ...(canSetDefaultView ? { default_workspace_view: resetWorkspace } : {}),
        },
      });
      if (updated) setUser(updated);
      setToast({ type: "success", message: "Preferences reset." });
    } catch (e) {
      setToast({ type: "error", message: e instanceof Error ? e.message : "Failed to reset preferences." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card">
      <h3 className="text-[18px] font-bold text-gs-text mb-6">System Preferences</h3>

      {toast && (
        <div className={`flex items-center gap-3 px-4 py-3 mb-6 rounded-xl text-sm font-medium border ${
          toast.type === "success"
            ? "bg-gs-green/10 border-gs-green/20 text-gs-green"
            : "bg-gs-red/10 border-gs-red/20 text-gs-red"
        }`}>
          {toast.type === "success"
            ? <Check className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
        </div>
      )}

      <div className="space-y-8">
        {canSetOrgPreferences && (
          <ToggleRow
            title="High-Priority Email Alerts"
            desc="Notify the organization owner when a member's analysis identifies critical regulatory gaps."
            enabled={highPriorityAlerts}
            onChange={setHighPriorityAlerts}
          />
        )}
        <ToggleRow
          title="Dark Mode Interface"
          desc="Switch between light and dark visual themes for the dashboard."
          enabled={theme === "dark"}
          onChange={handleDarkModeToggle}
        />
        {canSetDefaultView && (
          <div className="pt-4 border-t border-gs-border">
            <label className="block text-[12px] font-bold text-gs-muted uppercase tracking-wider mb-3">
              Default Workspace View
            </label>
            <div className="w-full md:w-1/2">
              <GsSelect
                value={workspaceView}
                onChange={setWorkspaceView}
                options={DEFAULT_WORKSPACE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              />
            </div>
          </div>
        )}
      </div>

      {hasSavedPreferences && (
        <div className="mt-10 flex justify-end gap-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-6 py-2.5 text-gs-muted text-[14px] font-bold hover:text-gs-text transition-colors disabled:opacity-50"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-8 py-2.5 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Update Preferences"}
          </button>
        </div>
      )}
    </div>
  );
}
