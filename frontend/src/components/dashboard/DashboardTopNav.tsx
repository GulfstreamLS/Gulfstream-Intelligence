"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Globe, Bell, ChevronDown, Menu, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";

interface DashboardTopNavProps {
  onMenuClick?: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":                 "Home",
  "/dashboard/chat":            "Regulatory Chat",
  "/dashboard/gap-assessment":  "Global Gap Assessment",
  "/dashboard/ha-simulation":   "Health Authority Simulation",
  "/dashboard/documents":       "Document Intelligence",
  "/dashboard/projects":        "Projects",
  "/dashboard/history":         "History",
  "/dashboard/reports":         "Reports",
  "/dashboard/settings":        "Settings",
};

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const label = ROUTE_LABELS[pathname];
  const isHome = pathname === "/dashboard";

  return (
    <nav className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
      <Link href="/dashboard" className="text-gs-muted hover:text-gs-text transition-colors">
        Home
      </Link>
      {!isHome && label && (
        <>
          <ChevronRight className="w-3 h-3 text-gs-muted" />
          <span className="text-gs-text">{label}</span>
        </>
      )}
    </nav>
  );
}

export function DashboardTopNav({ onMenuClick }: DashboardTopNavProps) {
  const [regionOpen, setRegionOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user ? getInitials(user.full_name, user.email) : "…";

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 h-16 bg-gs-card border-b border-gs-border">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gs-muted hover:text-gs-text hover:bg-gs-bg transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb — desktop only */}
      <Breadcrumb pathname={pathname} />

      {/* Right controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Region selector */}
        <div className="relative">
          <button
            onClick={() => setRegionOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gs-border text-sm font-medium text-gs-text hover:bg-gs-bg transition-colors"
          >
            <Globe className="w-4 h-4 text-gs-muted" />
            <span className="hidden sm:inline">Global</span>
            <ChevronDown className="w-3.5 h-3.5 text-gs-muted" />
          </button>

          {regionOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-gs-card border border-gs-border rounded-xl shadow-card-hover z-20">
              {["Global", "FDA", "EMA", "MHRA", "PMDA"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRegionOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gs-text hover:bg-gs-bg transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-gs-muted hover:text-gs-text hover:bg-gs-bg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-gs-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            2
          </span>
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gs-bg transition-colors min-h-[44px]"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-gs-blue flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gs-muted hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-gs-card border border-gs-border rounded-xl shadow-card-hover z-20 overflow-hidden">
              <button
                onClick={() => { setUserMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gs-red hover:bg-gs-red/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
