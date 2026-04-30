"use client";

import { Users, Globe, FileCheck, ShieldCheck } from "lucide-react";
import dynamic from "next/dynamic";
import { AUTHORITIES } from "../dashboard/GlobalCoverage";

const STATS = [
  { icon: Users,      value: "25+",     line1: "Years Regulatory",     line2: "Leadership" },
  { icon: Globe,      value: "Global",  line1: "Experience Across",    line2: "Major Health Authorities" },
  { icon: FileCheck,  value: "1000+",   line1: "Submissions",          line2: "Supported" },
  { icon: ShieldCheck,value: "Trusted", line1: "By Biotech, Pharma &", line2: "Medtech Device Leaders" },
];

const PINS = AUTHORITIES.map((a) => ({ key: a.code, coords: a.coords }));


/* ── lazy-load the map so it never runs on the server ───────── */
const WorldDotMap = dynamic(() => import("../../components/dashboard/WorldDotMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[2/1] rounded-xl border border-gs-border bg-gs-bg animate-pulse" />
  ),
});

export function CredentialsSection() {
  return (
    <section className="bg-[#EBF2FF] dark:bg-[#071830] py-4 lg:py-6 border-y border-blue-100 dark:border-[#1E3A5F]">
      <div className="gs-container">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-10 lg:gap-14 items-start">

          {/* ── Left: Expertise + Stats ─────────────────────────────── */}
          <div className="space-y-7">
            <div className="space-y-3">
              <p className="text-sm font-bold tracking-[0.08em] uppercase text-gs-blue leading-snug max-w-xs">
                Built by Regulatory Experts.<br />Backed by Real-World Experience.
              </p>
              <p className="text-[13px] text-gs-muted leading-relaxed max-w-sm">
                Decades of global regulatory leadership across FDA, EMA, MHRA, Health Canada,
                PMDA, TGA, and NMPA—now powered by AI to help you move your program forward.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-5">
              {STATS.map(({ icon: Icon, value, line1, line2 }) => (
                <div key={value} className="flex flex-col items-center text-center gap-2">
                  <Icon className="w-7 h-7 text-gs-blue shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-base font-extrabold text-gs-text dark:text-white leading-tight">{value}</p>
                    <p className="text-[10px] text-gs-muted leading-tight mt-0.5">{line1}</p>
                    <p className="text-[10px] text-gs-muted leading-tight">{line2}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Middle: Global Authorities ──────────────────────────── */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-bold tracking-[0.08em] uppercase text-gs-blue leading-snug">
                Global Perspective.<br />Local Expertise.
              </p>
              <p className="text-[13px] text-gs-muted leading-relaxed">
                Navigate regulatory pathways with confidence across every major health authority worldwide.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-4">
              {AUTHORITIES.map((auth) => (
                <div key={auth.code} className="flex flex-col items-center gap-1 min-w-[44px]">
                  <span className="text-2xl leading-none">{auth.flag}</span>
                  <p className="text-[11px] font-semibold text-gs-text dark:text-white">{auth.label}</p>
                  <p className="text-[10px] text-gs-muted">{auth.region}</p>
                </div>
              ))}
              <div className="flex flex-col items-center justify-center gap-1 min-w-[44px]">
                <span className="text-lg font-bold text-gs-blue tracking-widest">···</span>
                <p className="text-[10px] font-semibold text-gs-muted mt-1">&amp; More</p>
              </div>
            </div>
          </div>

          {/* ── Right: World Map ────────────────────────────────────── */}
         <WorldDotMap pins={PINS} />

        </div>
      </div>
    </section>
  );
}
