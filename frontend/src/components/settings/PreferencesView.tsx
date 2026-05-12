"use client";

import { useState, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";
import { ToggleRow, GsSelect } from "./SettingsPrimitives";
import { useThemeStore } from "../../store/themeStore";
import { useChatStore } from "../../store/chatStore";
import { authApi } from "../../lib/api";

const WORKSPACE_OPTIONS = [
  "Document Intelligence Overview",
  "Regulatory Chat",
  "Global Gap Assessment",
  "Health Authority Simulation",
  "History",
];

interface Toast { type: "success" | "error"; message: string; }

export function PreferencesView() {
  const theme   = useThemeStore((s) => s.theme);
  const toggle  = useThemeStore((s) => s.toggle);
  const user    = useChatStore((s) => s.user);
  const setUser = useChatStore((s) => s.setUser);

  const prefs = user?.preferences;

  const [aiAutoSummarize,    setAiAutoSummarize]    = useState(prefs?.ai_auto_summarize     ?? true);
  const [highPriorityAlerts, setHighPriorityAlerts] = useState(prefs?.high_priority_alerts  ?? true);
  const [workspaceView,      setWorkspaceView]      = useState(prefs?.default_workspace_view ?? WORKSPACE_OPTIONS[0]);
  const [saving,             setSaving]             = useState(false);
  const [toast,              setToast]              = useState<Toast | null>(null);

  // Sync from store when user loads (handles page refresh / first load)
  useEffect(() => {
    if (!user?.preferences) return;
    const p = user.preferences;
    if (p.ai_auto_summarize    !== undefined) setAiAutoSummarize(p.ai_auto_summarize);
    if (p.high_priority_alerts !== undefined) setHighPriorityAlerts(p.high_priority_alerts);
    if (p.default_workspace_view)            setWorkspaceView(p.default_workspace_view);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function handleDarkModeToggle() {
    toggle();
    // Persist immediately so the next save picks up the new value
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        preferences: {
          ai_auto_summarize:      aiAutoSummarize,
          high_priority_alerts:   highPriorityAlerts,
          default_workspace_view: workspaceView,
          dark_mode:              theme === "dark",
        },
      });
      if (updated) setUser(updated);
      setToast({ type: "success", message: "Preferences saved." });
    } catch (e) {
      setToast({ type: "error", message: e instanceof Error ? e.message : "Failed to save preferences." });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setAiAutoSummarize(true);
    setHighPriorityAlerts(true);
    setWorkspaceView(WORKSPACE_OPTIONS[0]);
    if (theme === "dark") toggle();
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
        <ToggleRow
          title="AI Auto-Summarization"
          desc="Automatically generate summaries for newly uploaded regulatory documents."
          enabled={aiAutoSummarize}
          onChange={setAiAutoSummarize}
        />
        <ToggleRow
          title="High-Priority Email Alerts"
          desc="Get notified immediately when critical regulatory gaps are identified."
          enabled={highPriorityAlerts}
          onChange={setHighPriorityAlerts}
        />
        <ToggleRow
          title="Dark Mode Interface"
          desc="Switch between light and dark visual themes for the dashboard."
          enabled={theme === "dark"}
          onChange={handleDarkModeToggle}
        />
        <div className="pt-4 border-t border-gs-border">
          <label className="block text-[12px] font-bold text-gs-muted uppercase tracking-wider mb-3">
            Default Workspace View
          </label>
          <div className="w-full md:w-1/2">
            <GsSelect
              value={workspaceView}
              onChange={setWorkspaceView}
              options={WORKSPACE_OPTIONS}
            />
          </div>
        </div>
      </div>

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
    </div>
  );
}
