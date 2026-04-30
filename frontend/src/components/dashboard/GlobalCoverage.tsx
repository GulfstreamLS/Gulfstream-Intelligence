"use client";

import dynamic from "next/dynamic";

/* ── authority badge data + map pin coordinates ─────────────── */
export const AUTHORITIES = [
  { code: "fda",  label: "FDA",           flag: "🇺🇸", coords: [ -97,  40] as [number, number], region:"USA", },
  { code: "ema",  label: "EMA",           flag: "🇪🇺", coords: [  10,  51] as [number, number], region:"EU", },
  { code: "mhra", label: "MHRA",          flag: "🇬🇧", coords: [  -1,  52] as [number, number], region:"UK", },
  { code: "hc",   label: "Health Canada", flag: "🇨🇦", coords: [ -96,  60] as [number, number], region:"Canada", },
  { code: "pmda", label: "PMDA",          flag: "🇯🇵", coords: [ 138,  36] as [number, number], region:"Japan", },
  { code: "tga",  label: "TGA",           flag: "🇦🇺", coords: [ 134, -25] as [number, number], region:"Australia", },
];

const PINS = AUTHORITIES.map((a) => ({ key: a.code, coords: a.coords }));

/* ── lazy-load the map so it never runs on the server ───────── */
const WorldDotMap = dynamic(() => import("./WorldDotMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[2/1] rounded-xl border border-gs-border bg-gs-bg animate-pulse" />
  ),
});

/* ─────────────────────────────────────────────────────────────── */

export function GlobalCoverage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-medium tracking-wide uppercase text-gs-muted">
        Global Coverage
      </p>

      {/* Map */}
      <div className="w-full rounded-xl border border-gs-border overflow-hidden bg-gs-card">
        <WorldDotMap pins={PINS} />
      </div>

      <p className="text-sm text-gs-muted leading-relaxed">
        Built for global submissions and interactions across all major health authorities.
      </p>

      {/* Authority flags */}
      <div className="flex flex-wrap gap-3">
        {AUTHORITIES.map((auth) => (
          <div key={auth.code} className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gs-bg border border-gs-border text-xl leading-none">
              {auth.flag}
            </div>
            <span className="text-[10px] text-gs-muted font-medium text-center leading-tight max-w-[52px]">
              {auth.label}
            </span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gs-bg border border-gs-border text-gs-muted font-bold text-sm">
            ···
          </div>
          <span className="text-[10px] text-gs-muted font-medium">& More</span>
        </div>
      </div>
    </div>
  );
}
