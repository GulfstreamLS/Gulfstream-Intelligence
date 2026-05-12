import { ToggleRow } from "./SettingsPrimitives";

export function NotificationsView() {
  return (
    <div className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card max-w-[800px]">
      <h3 className="text-[18px] font-bold text-gs-text mb-6">Notification Settings</h3>
      <div className="space-y-10">
        <section>
          <h4 className="text-[11px] font-bold text-gs-muted border-b border-gs-border pb-3 mb-5 uppercase tracking-widest">
            Alert Channels
          </h4>
          <div className="space-y-5">
            <ToggleRow title="Email Notifications"        desc="Weekly summaries and critical document alerts."            enabled />
            <ToggleRow title="In-App Push Notifications"  desc="Real-time updates on document analysis status."            enabled />
          </div>
        </section>

        <section>
          <h4 className="text-[11px] font-bold text-gs-muted border-b border-gs-border pb-3 mb-5 uppercase tracking-widest">
            Document Alerts
          </h4>
          <div className="space-y-5">
            <ToggleRow title="Gap Analysis Completion"  desc="Notify me when a document has finished gap assessment."  enabled />
            <ToggleRow title="High Risk Discovery"      desc="Alert for every high-risk non-compliance identified."     enabled />
            <ToggleRow title="Shared Document Activity" desc="When a colleague comments on my analysis." />
          </div>
        </section>
      </div>

      <div className="mt-12 flex justify-end">
        <button className="btn-primary px-8 py-2.5">Save Notification Settings</button>
      </div>
    </div>
  );
}
