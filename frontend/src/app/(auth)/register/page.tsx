"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User } from "lucide-react";
import { authApi, setTokenCookies } from "../../../lib/api";
import { useChatStore } from "../../../store/chatStore";
import Cookies from "js-cookie";

type AccountType = "solo" | "organization_member";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useChatStore((s) => s.setUser);

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("solo");
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) return;
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (accountType === "organization_member" && !orgName.trim()) {
      setError("Organization name is required");
      return;
    }
    setLoading(true);
    try {
      const tokens = await authApi.registerFull({
        email,
        password,
        full_name: fullName || undefined,
        account_type: accountType,
        org_name: accountType === "organization_member" ? orgName : undefined,
        org_email: accountType === "organization_member" ? (orgEmail || email) : undefined,
      });
      setTokenCookies(tokens);
      try {
        const user = await authApi.me();
        setUser(user);
        Cookies.set("pending_verify_id", user.id, { expires: 1 });
      } catch { /* non-fatal — cookie fallback works */ }
      router.push(`/verify-email?email=${encodeURIComponent(email)}&sent=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gs-bg px-4 py-8">
      <div className="w-full max-w-sm space-y-6 p-6 md:p-8 bg-gs-card border border-gs-border rounded-card shadow-card">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-gs-text">Create account</h1>
          <p className="text-sm text-gs-muted">
            {step === 1 ? "Join Gulfstream Intelligence" : "How will you use the platform?"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors ${
                s <= step ? "bg-gs-blue border-gs-blue text-white" : "border-gs-border text-gs-muted"
              }`}>{s}</div>
              {s < 2 && <div className={`flex-1 h-0.5 ${step > s ? "bg-gs-blue" : "bg-gs-border"}`} />}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gs-text">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm placeholder:text-gs-muted focus:outline-none focus:ring-2 focus:ring-gs-blue"
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gs-text">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm placeholder:text-gs-muted focus:outline-none focus:ring-2 focus:ring-gs-blue"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gs-text">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm placeholder:text-gs-muted focus:outline-none focus:ring-2 focus:ring-gs-blue"
                placeholder="Min. 8 characters"
              />
            </div>
            {error && <p className="text-sm text-gs-red bg-gs-red/10 border border-gs-red/20 rounded-button px-3 py-2">{error}</p>}
            <button type="submit" className="btn-primary w-full min-h-[44px]">Continue</button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gs-muted">Choose how you&apos;ll use Gulfstream Intelligence:</p>
            <div className="space-y-3">
              {[
                { value: "solo" as AccountType, icon: User, label: "Personal / Solo", desc: "I'll work alone, no team needed" },
                { value: "organization_member" as AccountType, icon: Building2, label: "Organization", desc: "I'm setting up a workspace for my team" },
              ].map(({ value, icon: Icon, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setAccountType(value); if (value === "organization_member") setOrgEmail(email); }}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    accountType === value ? "border-gs-blue bg-gs-blue/5" : "border-gs-border hover:border-gs-blue/40"
                  }`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg ${accountType === value ? "bg-gs-blue text-white" : "bg-gs-bg text-gs-muted"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gs-text">{label}</p>
                    <p className="text-xs text-gs-muted mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {accountType === "organization_member" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gs-text">Organization name <span className="text-gs-red">*</span></label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm placeholder:text-gs-muted focus:outline-none focus:ring-2 focus:ring-gs-blue"
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gs-text">
                    Organization email
                    <span className="text-xs text-gs-muted font-normal ml-1">(for system notifications)</span>
                  </label>
                  <input
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm placeholder:text-gs-muted focus:outline-none focus:ring-2 focus:ring-gs-blue"
                    placeholder={email}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-gs-red bg-gs-red/10 border border-gs-red/20 rounded-button px-3 py-2">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(1); setError(""); }}
                className="flex-1 min-h-[44px] border border-gs-border rounded-button text-sm font-medium text-gs-text hover:bg-gs-bg transition-colors"
              >
                Back
              </button>
              <button type="submit" disabled={loading} className="flex-1 btn-primary min-h-[44px] disabled:opacity-50">
                {loading ? "Creating…" : "Create account"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gs-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-gs-sky underline hover:text-gs-blue">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
