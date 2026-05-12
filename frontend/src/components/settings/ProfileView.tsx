"use client";

import { useEffect, useState } from "react";
import { FileText, Lock, Smartphone, Monitor } from "lucide-react";
import { InputGroup, SelectGroup, GsSelect, SecurityLink } from "./SettingsPrimitives";
import { useAuth } from "../../hooks/useAuth";
import { authApi, organizationApi } from "../../lib/api";

const LANGUAGES = ["English (US)", "English (UK)", "French", "German", "Spanish", "Japanese"];
const DATE_FORMATS = [
  "May 10, 2025 (MMM D, YYYY)",
  "05/10/2025 (MM/DD/YYYY)",
  "10/05/2025 (DD/MM/YYYY)",
  "2025-05-10 (YYYY-MM-DD)",
];
const NUMBER_FORMATS = ["1,234.56", "1.234,56", "1 234.56"];
const TIMEZONES = [
  "(UTC-08:00) Pacific Time (US & Canada)",
  "(UTC-07:00) Mountain Time (US & Canada)",
  "(UTC-06:00) Central Time (US & Canada)",
  "(UTC-05:00) Eastern Time (US & Canada)",
  "(UTC+00:00) UTC",
  "(UTC+01:00) Central European Time",
  "(UTC+05:30) India Standard Time",
  "(UTC+08:00) China Standard Time",
  "(UTC+09:00) Japan Standard Time",
];

export function ProfileView() {
  const { user, refreshUser } = useAuth();

  const prefs = user?.preferences ?? {};

  // Profile fields
  const [fullName, setFullName]   = useState(user?.full_name ?? "");
  // const [jobTitle, setJobTitle] = useState(prefs.job_title ?? "");
  const [org, setOrg]             = useState(prefs.organization ?? "");
  const [timezone, setTimezone]   = useState(prefs.timezone ?? "(UTC-05:00) Eastern Time (US & Canada)");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Language & Region fields
  const [language, setLanguage]       = useState(prefs.language ?? "English (US)");
  const [dateFormat, setDateFormat]   = useState(prefs.date_format ?? "May 10, 2025 (MMM D, YYYY)");
  const [numFormat, setNumFormat]     = useState(prefs.number_format ?? "1,234.56");
  const [regionMsg, setRegionMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const [regionSaving, setRegionSaving] = useState(false);

  // Sync when user loads / changes
  useEffect(() => {
    if (!user) return;
    let isCurrent = true;
    const p = user.preferences ?? {};
    setFullName(user.full_name ?? "");
    // setJobTitle(p.job_title ?? "");
    setOrg(p.organization ?? "");
    setTimezone(p.timezone ?? "(UTC-05:00) Eastern Time (US & Canada)");
    setLanguage(p.language ?? "English (US)");
    setDateFormat(p.date_format ?? "May 10, 2025 (MMM D, YYYY)");
    setNumFormat(p.number_format ?? "1,234.56");

    if (!p.organization && user.organization_id) {
      organizationApi.get()
        .then((organization) => {
          if (isCurrent) setOrg(organization.name);
        })
        .catch(() => null);
    }

    return () => {
      isCurrent = false;
    };
  }, [user]);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
  const isOrgMember = user?.account_type === "organization_member";
  const overviewOrg = org.trim();

  async function saveProfile() {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await authApi.updateProfile({
        full_name: fullName,
        preferences: { organization: isOrgMember ? org : undefined, timezone },
      });
      await refreshUser();
      setProfileMsg({ ok: true, text: "Profile saved." });
    } catch (e) {
      setProfileMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveRegion() {
    setRegionSaving(true);
    setRegionMsg(null);
    try {
      await authApi.updateProfile({
        preferences: { language, date_format: dateFormat, number_format: numFormat },
      });
      await refreshUser();
      setRegionMsg({ ok: true, text: "Preferences saved." });
    } catch (e) {
      setRegionMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setRegionSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left column */}
      <div className="lg:col-span-8 space-y-6">
        {/* Profile Information */}
        <section className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card">
          <div className="mb-6">
            <h3 className="text-[16px] font-bold text-gs-text mb-1">Profile Information</h3>
            <p className="text-[13px] text-gs-muted">
              {isOrgMember ? "Update your personal and organization details." : "Update your personal details."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <InputGroup label="Full Name"    value={fullName}  onChange={setFullName} />
            <InputGroup label="Email"        value={user?.email ?? ""} readOnly />
            {/* <InputGroup label="Job Title" value={jobTitle} onChange={setJobTitle} /> */}
            {isOrgMember && <InputGroup label="Organization" value={org} onChange={setOrg} />}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gs-muted uppercase tracking-wider mb-2">
                Time Zone
              </label>
              <GsSelect value={timezone} onChange={setTimezone} options={TIMEZONES} />
            </div>
          </div>
          {profileMsg && (
            <p className={`mt-4 text-[13px] font-bold ${profileMsg.ok ? "text-gs-green" : "text-gs-red"}`}>
              {profileMsg.text}
            </p>
          )}
          <div className="mt-8 flex justify-end">
            <button onClick={saveProfile} disabled={profileSaving} className="btn-primary px-6 py-2.5 disabled:opacity-60">
              {profileSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </section>

        {/* Language & Region */}
        <section className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card">
          <div className="mb-6">
            <h3 className="text-[16px] font-bold text-gs-text mb-1">Language & Region</h3>
            <p className="text-[13px] text-gs-muted">Set your language and regional preferences.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <SelectGroup label="Language"      value={language}    onChange={setLanguage}    options={LANGUAGES} />
            <SelectGroup label="Date Format"   value={dateFormat}  onChange={setDateFormat}  options={DATE_FORMATS} />
            <SelectGroup label="Number Format" value={numFormat}   onChange={setNumFormat}   options={NUMBER_FORMATS} />
          </div>
          {regionMsg && (
            <p className={`mt-4 text-[13px] font-bold ${regionMsg.ok ? "text-gs-green" : "text-gs-red"}`}>
              {regionMsg.text}
            </p>
          )}
          <div className="mt-8 flex justify-end">
            <button onClick={saveRegion} disabled={regionSaving} className="btn-secondary px-6 py-2.5 disabled:opacity-60">
              {regionSaving ? "Saving…" : "Save Changes"}
            </button>
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
              {isOrgMember && overviewOrg && (
                <p className="text-[13px] text-gs-muted mt-0.5 font-medium">{overviewOrg}</p>
              )}
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
