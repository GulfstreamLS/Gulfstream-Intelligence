"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, setTokenCookies } from "../../../lib/api";
import { useChatStore } from "../../../store/chatStore";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useChatStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await authApi.login(email, password);
      setTokenCookies(tokens);
      const user = await authApi.me();
      setUser(user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gs-bg px-4">
      <div className="w-full max-w-sm space-y-6 p-6 md:p-8 bg-gs-card border border-gs-border rounded-card shadow-card">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-gs-text">Welcome back</h1>
          <p className="text-sm text-gs-muted">Sign in to Gulfstream Intelligence</p>
        </div>

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

          <div className="space-y-1">
            <label className="text-sm font-medium text-gs-text">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm placeholder:text-gs-muted focus:outline-none focus:ring-2 focus:ring-gs-blue"
              placeholder="••••••••"
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-gs-muted">
          No account?{" "}
          <Link href="/register" className="text-gs-sky underline hover:text-gs-blue">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
