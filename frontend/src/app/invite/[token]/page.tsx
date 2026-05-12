"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Building2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { inviteApi, setTokenCookies } from "../../../lib/api";
import type { InviteDetails } from "../../../types";

type PageState = "loading" | "ready" | "expired" | "success";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    inviteApi.getDetails(token)
      .then((data) => { setInvite(data); setPageState("ready"); })
      .catch(() => setPageState("expired"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const tokens = await inviteApi.accept(token, password, fullName.trim() || undefined);
      setTokenCookies(tokens);
      setPageState("success");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  }

  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gs-bg">
        <div className="w-8 h-8 border-2 border-gs-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gs-bg px-4">
        <div className="w-full max-w-sm p-8 bg-gs-card border border-gs-border rounded-card shadow-card text-center space-y-4">
          <CheckCircle className="w-14 h-14 text-gs-green mx-auto" />
          <h1 className="text-xl font-bold text-gs-text">Account created!</h1>
          <p className="text-sm text-gs-muted">Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  if (pageState === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gs-bg px-4">
        <div className="w-full max-w-sm p-8 bg-gs-card border border-gs-border rounded-card shadow-card text-center space-y-4">
          <XCircle className="w-14 h-14 text-gs-red mx-auto" />
          <h1 className="text-xl font-bold text-gs-text">Invite expired</h1>
          <p className="text-sm text-gs-muted">
            This invite link has expired or has already been used. Ask your organization owner to send a new invite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gs-bg px-4">
      <div className="w-full max-w-sm space-y-6 p-6 md:p-8 bg-gs-card border border-gs-border rounded-card shadow-card">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-gs-blue/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-gs-blue" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gs-text">Accept invitation</h1>
          <p className="text-sm text-gs-muted">
            You&apos;ve been invited to join <span className="font-medium text-gs-text">{invite?.org_name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gs-text">Email</label>
            <input
              type="email"
              value={invite?.email ?? ""}
              disabled
              className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg/50 text-gs-muted text-sm cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gs-text">Your full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm placeholder:text-gs-muted focus:outline-none focus:ring-2 focus:ring-gs-blue"
              placeholder="Jane Smith"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gs-text">Set password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] pr-10 border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm placeholder:text-gs-muted focus:outline-none focus:ring-2 focus:ring-gs-blue"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gs-muted hover:text-gs-text transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gs-text">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] pr-10 border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm placeholder:text-gs-muted focus:outline-none focus:ring-2 focus:ring-gs-blue"
                placeholder="Repeat password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gs-muted hover:text-gs-text transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-gs-red bg-gs-red/10 border border-gs-red/20 rounded-button px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full min-h-[44px] disabled:opacity-50">
            {loading ? "Setting up account…" : "Accept & create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
