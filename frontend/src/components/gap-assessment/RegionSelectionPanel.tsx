"use client";

import { useState } from "react";
import { CheckCircle2, Globe, Edit3, ArrowRight } from "lucide-react";
import { FlagIcon } from "../ui/FlagIcon";

type SelectionMode =
  | { type: "single"; authority: string }
  | { type: "fda-ema" }
  | { type: "fda-ema-pmda" }
  | { type: "global" };

type RegionOption = {
  code: string;
  name: string;
  sub: string;
};

type MultiRegionOption = {
  codes: string[];
  label: string;
  type: Extract<SelectionMode["type"], "fda-ema" | "fda-ema-pmda">;
};

const REGIONS: RegionOption[] = [
  { code: "us", name: "FDA",           sub: "U.S."     },
  { code: "eu", name: "EMA",           sub: "EU"       },
  { code: "gb", name: "MHRA",          sub: "UK"       },
  { code: "ca", name: "Health Canada", sub: "Canada"   },
  { code: "jp", name: "PMDA",          sub: "Japan"    },
  { code: "cn", name: "NMPA",          sub: "China"    },
  { code: "au", name: "TGA",           sub: "Australia"},
];

const MULTI_REGIONS: MultiRegionOption[] = [
  { codes: ["us", "eu"],       label: "FDA + EMA",         type: "fda-ema"      },
  { codes: ["us", "eu", "jp"], label: "FDA + EMA + PMDA",  type: "fda-ema-pmda" },
];

function findRegion(authority: string) {
  return REGIONS.find(region => region.name === authority);
}

function findMultiRegion(type: SelectionMode["type"]) {
  return MULTI_REGIONS.find(region => region.type === type);
}

function RegionCard({ code, name, sub, active, onClick }: {
  code: string; name: string; sub: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center justify-center min-w-[90px] px-3 h-[105px] rounded-xl border-2 cursor-pointer transition-all ${
        active
          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-200 dark:ring-blue-900"
          : "border-gs-border bg-gs-card hover:border-gs-text/30"
      }`}
    >
      <div className="relative mb-2">
        <FlagIcon code={code} size={36} alt={name} />
        {active && (
          <div className="absolute -top-1 -right-2 bg-blue-600 text-white rounded-full p-0.5 shadow-sm border border-white dark:border-gs-card">
            <CheckCircle2 size={12} />
          </div>
        )}
      </div>
      <span className="text-[12px] font-bold text-gs-text tracking-wide leading-none text-center">{name}</span>
      <span className="text-[10px] font-bold text-gs-muted uppercase mt-1 leading-none">{sub}</span>
    </div>
  );
}

function MultiCard({ codes, label, active, onClick }: {
  codes: string[]; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
        active
          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-900"
          : "bg-gs-bg border-gs-border hover:border-blue-400"
      }`}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        {codes.map(c => <FlagIcon key={c} code={c} size={22} />)}
      </div>
      <span className={`text-[12px] font-bold uppercase tracking-wider ${active ? "text-blue-600" : "text-gs-muted"}`}>
        {label}
      </span>
      {active && <CheckCircle2 size={14} className="text-blue-600 ml-auto shrink-0" />}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-gs-border pb-4 last:border-0">
      <span className="text-[11px] font-bold text-gs-muted uppercase tracking-[0.1em]">{label}</span>
      <span className="text-[12px] font-bold text-gs-text uppercase tracking-tighter">{value}</span>
    </div>
  );
}

function SelectionPreview({ mode }: { mode: SelectionMode }) {
  if (mode.type === "single") {
    const r = findRegion(mode.authority);
    if (!r) {
      return (
        <div className="flex items-center gap-4 mb-10">
          <div className="w-[52px] h-[52px] rounded-full bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
            <Globe size={28} className="text-blue-600" />
          </div>
          <p className="text-[18px] font-bold text-gs-text leading-tight">{mode.authority}</p>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-4 mb-10">
        <FlagIcon code={r.code} size={44} alt={r.name} className="drop-shadow-sm" />
        <p className="text-[18px] font-bold text-gs-text leading-tight">{r.name} ({r.sub})</p>
      </div>
    );
  }
  const multi = findMultiRegion(mode.type);
  if (multi) {
    return (
      <div className="flex items-center gap-4 mb-10">
        <div className="flex items-center gap-2">
          {multi.codes.map(c => <FlagIcon key={c} code={c} size={44} className="drop-shadow-sm" />)}
        </div>
        <p className="text-[18px] font-bold text-gs-text leading-tight">{multi.label}</p>
      </div>
    );
  }
  // global
  return (
    <div className="flex items-center gap-4 mb-10">
      <div className="w-[52px] h-[52px] rounded-full bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
        <Globe size={28} className="text-blue-600" />
      </div>
      <p className="text-[18px] font-bold text-gs-text leading-tight">All Regions</p>
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
      <div className="lg:col-span-9 bg-gs-card p-8 rounded-xl border border-gs-border shadow-sm">
        <h2 className="text-[16px] font-bold text-gs-text mb-1">1. Select region or health authority</h2>
        <p className="text-[13px] text-gs-muted mb-8 font-medium">Choose the region(s) you want to assess your program against.</p>

        <div className="space-y-12">
          <section>
            <h3 className="text-[11px] font-bold text-gs-muted uppercase tracking-[0.1em] mb-5">Assess a single region</h3>
            <div className="flex flex-wrap gap-4">
              {REGIONS.map(r => (
                <RegionCard
                  key={r.name}
                  code={r.code}
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
              <h3 className="text-[11px] font-bold text-gs-muted uppercase tracking-[0.1em] mb-5">Assess multiple regions</h3>
              <div className="flex gap-4">
                {MULTI_REGIONS.map(m => (
                  <MultiCard
                    key={m.type}
                    codes={m.codes}
                    label={m.label}
                    active={mode.type === m.type}
                    onClick={() => apply(mode.type === m.type ? { type: "global" } : { type: m.type })}
                  />
                ))}
              </div>
            </section>

            <section className="flex flex-col justify-end">
              <div
                onClick={() => apply({ type: "global" })}
                className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                  mode.type === "global"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-900"
                    : "bg-gs-bg border-gs-border hover:border-blue-400"
                }`}
              >
                <Globe size={20} className={mode.type === "global" ? "text-blue-600" : "text-gs-muted"} />
                <span className={`text-[12px] font-bold uppercase tracking-wider ${mode.type === "global" ? "text-blue-600" : "text-gs-muted"}`}>
                  Global (All Regions)
                </span>
                {mode.type === "global" && <CheckCircle2 size={14} className="text-blue-600 ml-auto" />}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Summary panel */}
      <div className="lg:col-span-3 bg-gs-card p-8 rounded-xl border border-gs-border shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <span className="text-[11px] font-bold text-gs-muted uppercase tracking-[0.1em]">Your selection</span>
          <button onClick={handleReset} className="text-blue-600 text-[12px] font-bold flex items-center gap-1 hover:underline">
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
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-blue-100 mt-10 hover:bg-blue-700 transition-all"
        >
          Apply Filter <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
