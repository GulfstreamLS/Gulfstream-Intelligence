"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
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
          <h1 className="text-2xl font-bold text-gs-text">Forgot password</h1>
          <p className="text-sm text-gs-muted">
            {sent
              ? "Check your email"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-gs-muted text-center">
              If an account with that email exists, a password reset link has been sent.
            </p>
            <Link
              href="/login"
              className="btn-primary w-full min-h-[44px] flex items-center justify-center"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? "Sending…" : "Send reset link"}
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
