"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  Globe,
  Stethoscope,
  FileText,
  FolderOpen,
  History,
  BarChart2,
  Settings,
  X,
} from "lucide-react";
import { GsLogo } from "../ui/GsLogo";
import { cn } from "../../lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const primaryNav: NavItem[] = [
  { label: "Home",                        href: "/dashboard",                icon: Home },
  { label: "Regulatory Chat",             href: "/dashboard/chat",           icon: MessageSquare },
  { label: "Global Gap Assessment",       href: "/dashboard/gap-assessment", icon: Globe },
  { label: "Health Authority Simulation", href: "/dashboard/ha-simulation",  icon: Stethoscope },
  { label: "Document Intelligence",       href: "/dashboard/documents",      icon: FileText },
    { label: "Projects",  href: "/dashboard/projects",  icon: FolderOpen },
  { label: "History",   href: "/dashboard/history",   icon: History },
  { label: "Reports",   href: "/dashboard/reports",   icon: BarChart2 },
  { label: "Settings",  href: "/dashboard/settings",  icon: Settings },
];

interface DashboardSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col bg-gs-card border-r border-gs-border transition-transform duration-300",
          "lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-[26px] py-5 border-b border-gs-border">
          <GsLogo variant="default" iconSize={36} />
          <button
            onClick={onClose}
            className="lg:hidden text-gs-muted hover:text-gs-text transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-[2px]">
          {primaryNav.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </nav>
      </aside>
    </>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-[11px] rounded-lg transition-all min-h-[44px]",
        active
          ? "bg-blue-50 text-gs-blue font-bold shadow-sm dark:bg-gs-blue/10"
          : "text-gs-muted hover:bg-gs-bg font-semibold"
      )}
    >
      <Icon
        className={cn(
          "w-[19px] h-[19px] shrink-0",
          active ? "text-gs-blue" : "text-gs-muted"
        )}
      />
      <span className="text-[14px]">{item.label}</span>
    </Link>
  );
}
