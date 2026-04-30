import { ToggleRow, GsSelect } from "./SettingsPrimitives";

export function PreferencesView() {
  return (
    <div className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card">
      <h3 className="text-[18px] font-bold text-gs-text mb-6">System Preferences</h3>
      <div className="space-y-8">
        <ToggleRow
          title="AI Auto-Summarization"
          desc="Automatically generate summaries for newly uploaded regulatory documents."
          enabled
        />
        <ToggleRow
          title="High-Priority Email Alerts"
          desc="Get notified immediately when critical regulatory gaps are identified."
          enabled
        />
        <ToggleRow
          title="Dark Mode Interface"
          desc="Switch between light and dark visual themes for the dashboard."
        />
        <div className="pt-4 border-t border-gs-border">
          <label className="block text-[12px] font-bold text-gs-muted uppercase tracking-wider mb-3">
            Default Workspace View
          </label>
          <div className="w-full md:w-1/2">
            <GsSelect value="Document Intelligence Overview" />
          </div>
        </div>
      </div>
      <div className="mt-10 flex justify-end gap-3">
        <button className="px-6 py-2.5 text-gs-muted text-[14px] font-bold hover:text-gs-text transition-colors">
          Reset Defaults
        </button>
        <button className="btn-primary px-8 py-2.5">Update Preferences</button>
      </div>
    </div>
  );
}
