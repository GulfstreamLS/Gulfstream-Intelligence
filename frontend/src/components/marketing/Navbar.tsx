"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { GsLogo } from "../ui/GsLogo";

const NAV_LINKS = [
  { label: "Platform", href: "#platform", hasDropdown: true },
  { label: "Contact Us", href: "#contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="mx-auto flex h-[68px] w-[80%] items-center justify-between gap-6">
        <GsLogo
          iconSize={34}
          className="gap-2.5 [&_p:first-child]:text-[16px] [&_p:last-child]:text-[16px] [&_p]:tracking-[0.16em]"
        />

        {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-8">

        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-1 text-[13px] font-bold text-[#071B4D] transition-colors hover:text-[#2563EB]"
            >
              {link.label}
              {link.hasDropdown && <ChevronDown className="w-3.5 h-3.5" />}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
          <Link
            href="/login"
            className="rounded-[4px] border border-[#071B4D] bg-white/70 px-5 py-2.5 text-[13px] font-bold text-[#071B4D] shadow-sm backdrop-blur transition-colors hover:bg-white"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-[4px] bg-[#2563EB] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(37,99,235,0.24)] transition-colors hover:bg-[#0F2A6B]"
          >
            Sign Up Now
          </Link>
        </div>

        {/* Mobile right */}
        <div className="flex md:hidden items-center gap-1">
          <button
            className="p-2 rounded-lg hover:bg-gs-bg dark:hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen
              ? <X className="w-5 h-5 text-gs-text dark:text-white" />
              : <Menu className="w-5 h-5 text-gs-text dark:text-white" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mx-auto w-[80%] rounded-[8px] border border-[#E5E7EB] bg-white px-5 py-4 shadow-card-hover md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center justify-between border-b border-[#E5E7EB] py-3 text-sm font-medium text-[#071B4D] last:border-0"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
              {link.hasDropdown && <ChevronDown className="w-4 h-4 text-gs-muted" />}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link href="/login" className="btn-secondary text-center" onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-center" onClick={() => setMobileOpen(false)}>
              Sign Up Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
