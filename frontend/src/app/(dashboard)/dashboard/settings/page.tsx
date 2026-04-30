import { ShieldCheck } from "lucide-react";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-10 flex flex-col gap-8 max-w-[1280px] mx-auto w-full">

      {/* Title */}
      <div>
        <h2 className="text-2xl md:text-[32px] font-bold text-gs-text tracking-tight mb-2">
          Settings
        </h2>
        <p className="text-gs-muted text-[15px]">
          Manage your account, preferences, team, and platform settings.
        </p>
      </div>

      {/* Tabs + content */}
      <SettingsTabs />

      {/* Footer */}
      <footer className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-gs-muted">
          <ShieldCheck className="w-4 h-4 text-gs-green" />
          <span className="text-[11px] font-bold tracking-tight uppercase">
            All settings are encrypted and stored securely.
          </span>
        </div>
        <p className="text-[11px] text-gs-muted font-medium">
          Your data is protected in compliance with global data protection standards (GDPR, SOC2).
        </p>
      </footer>
    </div>
  );
}
