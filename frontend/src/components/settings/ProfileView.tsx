import { FileText, Lock, Smartphone, Monitor } from "lucide-react";
import { InputGroup, SelectGroup, GsSelect, SecurityLink } from "./SettingsPrimitives";
import { useAuth } from "../../hooks/useAuth";

export function ProfileView() {
  const { user } = useAuth();

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left column */}
      <div className="lg:col-span-8 space-y-6">
        {/* Profile Information */}
        <section className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card">
          <div className="mb-6">
            <h3 className="text-[16px] font-bold text-gs-text mb-1">Profile Information</h3>
            <p className="text-[13px] text-gs-muted">Update your personal and organization details.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <InputGroup label="Full Name"     value={user?.full_name ?? ""} />
            <InputGroup label="Email"         value={user?.email ?? ""} />
            <InputGroup label="Job Title"     value="" />
            <InputGroup label="Organization"  value="Gulfstream Intelligence" />
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gs-muted uppercase tracking-wider mb-2">
                Time Zone
              </label>
              <GsSelect value="(UTC-05:00) Eastern Time (US & Canada)" />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button className="btn-primary px-6 py-2.5">Save Changes</button>
          </div>
        </section>

        {/* Language & Region */}
        <section className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card">
          <div className="mb-6">
            <h3 className="text-[16px] font-bold text-gs-text mb-1">Language & Region</h3>
            <p className="text-[13px] text-gs-muted">Set your language and regional preferences.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <SelectGroup label="Language"      value="English (US)" />
            <SelectGroup label="Date Format"   value="May 10, 2025 (MMM D, YYYY)" />
            <SelectGroup label="Number Format" value="1,234.56" />
          </div>
          <div className="mt-8 flex justify-end">
            <button className="btn-secondary px-6 py-2.5">Save Changes</button>
          </div>
        </section>
      </div>

      {/* Right column */}
      <div className="lg:col-span-4 space-y-6">
        {/* Account Overview */}
        <div className="bg-gs-card rounded-xl border border-gs-border p-6 shadow-card">
          <h3 className="text-[15px] font-bold text-gs-text mb-6">Account Overview</h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-gs-blue shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-gs-text">{user?.full_name ?? user?.email ?? "—"}</h4>
              <p className="text-[13px] text-gs-muted mt-0.5 font-medium">Enterprise Plan</p>
              <p className="text-[11px] text-gs-muted font-bold mt-2">Member since {memberSince}</p>
            </div>
          </div>
        </div>

        {/* Security Quick Links */}
        <div className="bg-gs-card rounded-xl border border-gs-border p-6 shadow-card">
          <h3 className="text-[15px] font-bold text-gs-text mb-5">Security Quick Links</h3>
          <div className="space-y-1">
            <SecurityLink icon={<Lock className="w-[18px] h-[18px]" />}       label="Change Password" />
            <SecurityLink
              icon={<Smartphone className="w-[18px] h-[18px]" />}
              label="Multi-Factor Authentication"
              badge="Enabled"
              badgeColor="bg-green-50 text-green-600"
            />
            <SecurityLink icon={<Monitor className="w-[18px] h-[18px]" />}    label="Active Sessions" count="3" />
          </div>
        </div>
      </div>
    </div>
  );
}
