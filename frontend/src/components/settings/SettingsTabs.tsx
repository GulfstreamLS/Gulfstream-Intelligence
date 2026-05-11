"use client";

import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { ProfileView }       from "./ProfileView";
import { PreferencesView }   from "./PreferencesView";
import { TeamView }          from "./TeamView";
import { OrganizationView }  from "./OrganizationView";
import { SecurityView }      from "./SecurityView";
import { NotificationsView } from "./NotificationsView";
import { AuditLogView }      from "./AuditLogView";
import { useChatStore }      from "../../store/chatStore";
import { organizationApi }   from "../../lib/api";
import type { OrgMember }    from "../../types";

type Tab = "Profile" | "Preferences" | "Security" | "Notifications" | "Audit Log" | "Organization" | "Team";

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
      {active && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gs-blue rounded-t-full" />}
    </button>
  );
}

export function SettingsTabs() {
  const user = useChatStore((s) => s.user);
  const [active, setActive] = useState<Tab>("Profile");
  const [isOwner, setIsOwner] = useState(false);

  const isOrgMember = user?.account_type === "organization_member";

  useEffect(() => {
    if (!isOrgMember || !user) return;
    organizationApi.listMembers()
      .then((members: OrgMember[]) => {
        const me = members.find((m) => m.user_id === user.id);
        setIsOwner(me?.role === "owner");
      })
      .catch(() => setIsOwner(false));
  }, [isOrgMember, user]);

  const TABS: Tab[] = [
    "Profile",
    "Preferences",
    "Security",
    "Notifications",
    "Audit Log",
    ...(isOwner ? (["Organization", "Team"] as Tab[]) : []),
  ];

  // Reset active tab if it's no longer visible (e.g. role changed)
  useEffect(() => {
    if (!TABS.includes(active)) setActive("Profile");
  }, [isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex overflow-x-auto border-b border-gs-border mb-8 -mx-1 px-1">
        {TABS.map((tab) => (
          <TabItem key={tab} label={tab} active={active === tab} onClick={() => setActive(tab)} />
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {active === "Profile"       && <ProfileView />}
        {active === "Preferences"   && <PreferencesView />}
        {active === "Security"      && <SecurityView />}
        {active === "Notifications" && <NotificationsView />}
        {active === "Audit Log"     && <AuditLogView />}
        {active === "Organization"  && isOwner && <OrganizationView />}
        {active === "Team"          && isOwner && <TeamView />}
      </div>
    </>
  );
}
