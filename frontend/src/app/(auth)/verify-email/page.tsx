"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";
import Cookies from "js-cookie";
import { authApi } from "../../../lib/api";
import { useChatStore } from "../../../store/chatStore";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useChatStore((s) => s.user);

  const emailFromParam = searchParams.get("email") ?? "";
  const justSent = searchParams.get("sent") === "1";
  const selectedPlan = searchParams.get("plan");

  const email = user?.email ?? emailFromParam;
  const userId = user?.id ?? Cookies.get("pending_verify_id") ?? "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(justSent ? 60 : 0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  function handleDigit(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) { setError("Please enter all 6 digits"); return; }
    if (!userId) { setError("Session expired. Please register again."); return; }
    setError("");
    setLoading(true);
    try {
      await authApi.verifyEmail(userId, code);
      Cookies.remove("pending_verify_id");
      router.push(`/pricing${selectedPlan ? `?plan=${selectedPlan}` : ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code. Please try again.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    setResendSuccess(false);
    setError("");
    try {
      await authApi.resendVerification();
      setResendCooldown(60);
      setResendSuccess(true);
    } catch {
      // ignore
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gs-bg px-4">
      <div className="w-full max-w-sm space-y-6 p-6 md:p-8 bg-gs-card border border-gs-border rounded-card shadow-card text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-gs-blue/10 flex items-center justify-center">
            <Mail className="w-7 h-7 text-gs-blue" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gs-text">Verify your email</h1>
          <p className="text-sm text-gs-muted">
            Enter the 6-digit code sent to{" "}
            {email
              ? <strong className="text-gs-text">{email}</strong>
              : "your email address"
            }
          </p>
        </div>

        {/* Sent confirmation banner */}
        {(justSent || resendSuccess) && (
          <div className="flex items-center gap-2.5 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl text-left">
            <CheckCircle className="w-4 h-4 text-gs-green shrink-0" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              {resendSuccess ? "New code sent!" : "Code sent — check your inbox."}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-xl font-bold border-2 border-gs-border rounded-xl bg-gs-bg text-gs-text focus:outline-none focus:border-gs-blue transition-colors"
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-gs-red bg-gs-red/10 border border-gs-red/20 rounded-button px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || digits.join("").length < 6}
            className="btn-primary w-full min-h-[44px] disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify email"}
          </button>
        </form>

        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          className="flex items-center gap-1.5 text-sm text-gs-sky hover:text-gs-blue mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? "animate-spin" : ""}`} />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
