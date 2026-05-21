"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

/* ── Input ─────────────────────────────────────────────────────── */
export function InputGroup({
  label,
  value,
  onChange,
  type = "text",
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gs-muted uppercase tracking-wider mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        className="w-full h-11 px-4 bg-gs-card border border-gs-border rounded-lg text-[14px] font-medium text-gs-text focus:outline-none focus:border-gs-blue disabled:opacity-60 read-only:opacity-60"
      />
    </div>
  );
}

/* ── Select ─────────────────────────────────────────────────────── */
export function GsSelect({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  options?: Array<string | { value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
        className="w-full h-11 px-4 bg-gs-card border border-gs-border rounded-lg text-[14px] font-medium text-gs-text appearance-none focus:outline-none focus:border-gs-blue disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {options
          ? options.map(o => {
              const option = typeof o === "string" ? { value: o, label: o } : o;
              return <option key={option.value} value={option.value}>{option.label}</option>;
            })
          : <option value={value}>{value}</option>}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gs-muted pointer-events-none w-4 h-4" />
    </div>
  );
}

export function SelectGroup({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  options?: Array<string | { value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gs-muted uppercase tracking-wider mb-2">
        {label}
      </label>
      <GsSelect value={value} onChange={onChange} options={options} disabled={disabled} />
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────────────────────── */
export function ToggleRow({
  title,
  desc,
  enabled = false,
  onChange,
}: {
  title: string;
  desc: string;
  enabled?: boolean;
  onChange?: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="pr-10">
        <p className="text-[14px] font-bold text-gs-text mb-0.5">{title}</p>
        <p className="text-[12px] text-gs-muted">{desc}</p>
      </div>
      <div
        onClick={() => onChange?.(!enabled)}
        className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
          onChange ? "cursor-pointer" : "cursor-default"
        } ${enabled ? "bg-gs-blue" : "bg-gs-border"}`}
      >
        <div
          className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </div>
    </div>
  );
}

/* ── Security sidebar link ───────────────────────────────────────── */
export function SecurityLink({
  icon,
  label,
  badge,
  badgeColor,
  count,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string;
  count?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between py-3.5 group cursor-pointer border-b border-gs-border last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className="text-gs-muted group-hover:text-gs-blue transition-colors">{icon}</div>
        <span className="text-[13px] font-bold text-gs-muted group-hover:text-gs-text transition-colors">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {badge && (
          <span className={`${badgeColor} text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-widest`}>
            {badge}
          </span>
        )}
        {count && (
          <span className="bg-blue-50 text-gs-blue text-[11px] font-black px-2 py-0.5 rounded">
            {count}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gs-muted" />
      </div>
    </div>
  );
}
