"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "../../../lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing reset token. Use the link from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gs-bg px-4">
      <div className="w-full max-w-sm space-y-6 p-6 md:p-8 bg-gs-card border border-gs-border rounded-card shadow-card">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-gs-text">
            {done ? "Password reset" : "Reset your password"}
          </h1>
          <p className="text-sm text-gs-muted">
            {done
              ? "Your password has been updated successfully"
              : "Enter your new password below"}
          </p>
        </div>

        {done ? (
          <div className="space-y-4">
            <Link
              href="/login"
              className="btn-primary w-full min-h-[44px] flex items-center justify-center"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gs-text">New password</label>
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
              <label className="text-sm font-medium text-gs-text">Confirm new password</label>
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full min-h-[44px] disabled:opacity-50"
            >
              {loading ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gs-muted">
          Remember your password?{" "}
          <Link href="/login" className="text-gs-sky underline hover:text-gs-blue">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
