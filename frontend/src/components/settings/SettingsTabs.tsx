"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProfileView }       from "./ProfileView";
import { PreferencesView }   from "./PreferencesView";
import { TeamView }          from "./TeamView";
import { SecurityView }      from "./SecurityView";
import { NotificationsView } from "./NotificationsView";
import { AuditLogView }      from "./AuditLogView";

const TABS = ["Profile", "Preferences", "Team", "Security", "Notifications", "Audit Log"] as const;
type Tab = (typeof TABS)[number];

function TabItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 md:px-8 py-4 text-[15px] font-bold cursor-pointer transition-all relative whitespace-nowrap",
        active ? "text-gs-blue" : "text-gs-muted hover:text-gs-text"
      )}
    >
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gs-blue rounded-t-full" />
      )}
    </button>
  );
}

export function SettingsTabs() {
  const [active, setActive] = useState<Tab>("Profile");

  return (
    <>
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-gs-border mb-8 -mx-1 px-1">
        {TABS.map((tab) => (
          <TabItem key={tab} label={tab} active={active === tab} onClick={() => setActive(tab)} />
        ))}
      </div>

      {/* Active view */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {active === "Profile"       && <ProfileView />}
        {active === "Preferences"   && <PreferencesView />}
        {active === "Team"          && <TeamView />}
        {active === "Security"      && <SecurityView />}
        {active === "Notifications" && <NotificationsView />}
        {active === "Audit Log"     && <AuditLogView />}
      </div>
    </>
  );
}
