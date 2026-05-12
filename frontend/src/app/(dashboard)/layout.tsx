"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { DashboardSidebar } from "../../components/dashboard/DashboardSidebar";
import { DashboardTopNav } from "../../components/dashboard/DashboardTopNav";
import { subscriptionApi } from "../../lib/api";
import { useChatStore } from "../../store/chatStore";
import { useThemeStore } from "../../store/themeStore";
import type { Subscription } from "../../types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const router = useRouter();
  const user = useChatStore((s) => s.user);
  const setTheme = useThemeStore((s) => s.theme);
  const themeToggle = useThemeStore((s) => s.toggle);

  useEffect(() => {
    subscriptionApi.get().then(setSubscription).catch(() => null);
  }, []);

  // Sync dark_mode preference from user profile to local themeStore so it
  // persists across sessions and devices, not just localStorage on this device.
  useEffect(() => {
    if (user?.preferences?.dark_mode === undefined) return;
    const wantDark = user.preferences.dark_mode;
    if (wantDark && setTheme !== "dark") themeToggle();
    if (!wantDark && setTheme === "dark") themeToggle();
  }, [user?.id, user?.preferences?.dark_mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const isExpired = subscription?.status === "expired" || subscription?.status === "cancelled";
  const showBanner = isExpired && !bannerDismissed;

  // Org members (non-owners) should not see pricing — only owners and solo users
  const canSeePricing = user?.account_type !== "organization_member";

  return (
    <div className="flex bg-gs-bg overflow-hidden" style={{ height: "100dvh" }}>
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {showBanner && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="flex-1 text-sm font-medium text-amber-800 dark:text-amber-300">
              Your free trial has ended. Your data is safe — subscribe to continue using all features.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              {canSeePricing && (
                <button
                  onClick={() => router.push("/pricing")}
                  className="text-sm font-bold text-amber-800 dark:text-amber-300 underline hover:no-underline"
                >
                  View Plans
                </button>
              )}
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <DashboardTopNav onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
