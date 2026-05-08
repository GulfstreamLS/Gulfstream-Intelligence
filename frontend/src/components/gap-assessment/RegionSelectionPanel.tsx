"use client";

import { useState } from "react";
import { CheckCircle2, Globe, Edit3, ArrowRight } from "lucide-react";

type SelectionMode =
  | { type: "single"; authority: string }
  | { type: "fda-ema" }
  | { type: "fda-ema-pmda" }
  | { type: "global" };

const REGIONS = [
  { flag: "🇺🇸", name: "FDA",           sub: "U.S."     },
  { flag: "🇪🇺", name: "EMA",           sub: "EU"       },
  { flag: "🇬🇧", name: "MHRA",          sub: "UK"       },
  { flag: "🇨🇦", name: "Health Canada", sub: "Canada"   },
  { flag: "🇯🇵", name: "PMDA",          sub: "Japan"    },
  { flag: "🇨🇳", name: "NMPA",          sub: "China"    },
  { flag: "🇦🇺", name: "TGA",           sub: "Australia"},
];

function RegionCard({ flag, name, sub, active, onClick }: {
  flag: string; name: string; sub: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-[105px] h-[105px] rounded-xl border-2 cursor-pointer transition-all ${
        active
          ? "border-[#2563EB] bg-blue-50/50 shadow-sm ring-1 ring-blue-100"
          : "border-[#F1F5F9] bg-white hover:border-[#E2E8F0]"
      }`}
    >
      <div className="relative">
        <span className="text-[34px] mb-2 block leading-none">{flag}</span>
        {active && (
          <div className="absolute -top-1 -right-2 bg-[#2563EB] text-white rounded-full p-0.5 shadow-sm border border-white">
            <CheckCircle2 size={12} />
          </div>
        )}
      </div>
      <span className="text-[12px] font-bold text-[#0F172A] tracking-wider leading-none">{name}</span>
      <span className="text-[10px] font-bold text-[#94A3B8] uppercase mt-1 leading-none">{sub}</span>
    </div>
  );
}

function MultiCard({ flags, label, active, onClick }: {
  flags: string[]; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
        active
          ? "border-[#2563EB] bg-blue-50/50 ring-1 ring-blue-100"
          : "bg-[#F8FAFC] border-[#E2E8F0] hover:border-blue-400"
      }`}
    >
      <div className="flex -space-x-2">
        {flags.map((f, i) => <span key={i} className="text-xl">{f}</span>)}
      </div>
      <span className={`text-[12px] font-bold uppercase tracking-wider ${active ? "text-[#2563EB]" : "text-[#475569]"}`}>
        {label}
      </span>
      {active && <CheckCircle2 size={14} className="text-[#2563EB] ml-auto shrink-0" />}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-[#F8FAFC] pb-4 last:border-0">
      <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">{label}</span>
      <span className="text-[12px] font-bold text-[#475569] uppercase tracking-tighter">{value}</span>
    </div>
  );
}

function SelectionPreview({ mode }: { mode: SelectionMode }) {
  if (mode.type === "single") {
    const r = REGIONS.find(x => x.name === mode.authority)!;
    return (
      <div className="flex items-center gap-4 mb-10">
        <div className="text-[44px] leading-none drop-shadow-sm">{r.flag}</div>
        <p className="text-[18px] font-bold text-[#0F172A] leading-tight">{r.name} ({r.sub})</p>
      </div>
    );
  }
  if (mode.type === "fda-ema") {
    return (
      <div className="flex items-center gap-4 mb-10">
        <div className="flex -space-x-3 text-[44px] leading-none drop-shadow-sm">
          <span>🇺🇸</span><span>🇪🇺</span>
        </div>
        <p className="text-[18px] font-bold text-[#0F172A] leading-tight">FDA + EMA</p>
      </div>
    );
  }
  if (mode.type === "fda-ema-pmda") {
    return (
      <div className="flex items-center gap-4 mb-10">
        <div className="flex -space-x-3 text-[40px] leading-none drop-shadow-sm">
          <span>🇺🇸</span><span>🇪🇺</span><span>🇯🇵</span>
        </div>
        <p className="text-[18px] font-bold text-[#0F172A] leading-tight">FDA + EMA + PMDA</p>
      </div>
    );
  }
  // global
  return (
    <div className="flex items-center gap-4 mb-10">
      <div className="w-[52px] h-[52px] rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center shrink-0">
        <Globe size={28} className="text-[#2563EB]" />
      </div>
      <p className="text-[18px] font-bold text-[#0F172A] leading-tight">All Regions</p>
    </div>
  );
}

function filterLabel(mode: SelectionMode): string {
  if (mode.type === "single") return mode.authority;
  if (mode.type === "fda-ema") return "FDA + EMA";
  if (mode.type === "fda-ema-pmda") return "FDA + EMA + PMDA";
  return "Global";
}

export function RegionSelectionPanel({
  onAuthorityChange,
  selectedAuthority,
}: {
  onAuthorityChange: (auth: string | undefined) => void;
  selectedAuthority?: string;
}) {
  const [mode, setMode] = useState<SelectionMode>(
    selectedAuthority
      ? { type: "single", authority: selectedAuthority }
      : { type: "global" }
  );

  const apply = (next: SelectionMode) => {
    setMode(next);
    onAuthorityChange(next.type === "single" ? next.authority : undefined);
  };

  const handleSingleClick = (name: string) => {
    if (mode.type === "single" && mode.authority === name) {
      apply({ type: "global" });
    } else {
      apply({ type: "single", authority: name });
    }
  };

  const handleReset = () => apply({ type: "global" });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      {/* Selector panel */}
      <div className="lg:col-span-9 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
        <h2 className="text-[16px] font-bold text-[#1E293B] mb-1">1. Select region or health authority</h2>
        <p className="text-[13px] text-[#94A3B8] mb-8 font-medium">Choose the region(s) you want to assess your program against.</p>

        <div className="space-y-12">
          <section>
            <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-5">Assess a single region</h3>
            <div className="flex flex-wrap gap-4">
              {REGIONS.map(r => (
                <RegionCard
                  key={r.name}
                  flag={r.flag}
                  name={r.name}
                  sub={r.sub}
                  active={mode.type === "single" && mode.authority === r.name}
                  onClick={() => handleSingleClick(r.name)}
                />
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section>
              <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-5">Assess multiple regions</h3>
              <div className="flex gap-4">
                <MultiCard
                  flags={["🇺🇸", "🇪🇺"]}
                  label="FDA + EMA"
                  active={mode.type === "fda-ema"}
                  onClick={() => apply(mode.type === "fda-ema" ? { type: "global" } : { type: "fda-ema" })}
                />
                <MultiCard
                  flags={["🇺🇸", "🇪🇺", "🇯🇵"]}
                  label="FDA + EMA + PMDA"
                  active={mode.type === "fda-ema-pmda"}
                  onClick={() => apply(mode.type === "fda-ema-pmda" ? { type: "global" } : { type: "fda-ema-pmda" })}
                />
              </div>
            </section>

            <section className="flex flex-col justify-end">
              <div
                onClick={() => apply({ type: "global" })}
                className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                  mode.type === "global"
                    ? "border-[#2563EB] bg-blue-50/50 ring-1 ring-blue-100"
                    : "bg-[#F8FAFC] border-[#E2E8F0] hover:border-blue-400"
                }`}
              >
                <Globe size={20} className={mode.type === "global" ? "text-[#2563EB]" : "text-[#64748B]"} />
                <span className={`text-[12px] font-bold uppercase tracking-wider ${mode.type === "global" ? "text-[#2563EB]" : "text-[#475569]"}`}>
                  Global (All Regions)
                </span>
                {mode.type === "global" && <CheckCircle2 size={14} className="text-[#2563EB] ml-auto" />}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Summary panel */}
      <div className="lg:col-span-3 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em]">Your selection</span>
          <button onClick={handleReset} className="text-[#2563EB] text-[12px] font-bold flex items-center gap-1 hover:underline">
            <Edit3 size={14} /> Reset
          </button>
        </div>

        <SelectionPreview mode={mode} />

        <div className="space-y-6 flex-1">
          <SummaryItem label="Filter" value={filterLabel(mode)} />
          <SummaryItem label="Status" value="Active" />
        </div>

        <button
          onClick={() => onAuthorityChange(mode.type === "single" ? mode.authority : undefined)}
          className="w-full py-4 bg-[#2563EB] text-white rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-blue-100 mt-10 hover:bg-[#1D4ED8] transition-all"
        >
          Apply Filter <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
