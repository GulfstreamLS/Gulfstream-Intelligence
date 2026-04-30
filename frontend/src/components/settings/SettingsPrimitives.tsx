import { ChevronDown, ChevronRight } from "lucide-react";

/* ── Input ─────────────────────────────────────────────────────── */
export function InputGroup({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gs-muted uppercase tracking-wider mb-2">
        {label}
      </label>
      <input
        type="text"
        defaultValue={value}
        className="w-full h-11 px-4 bg-gs-card border border-gs-border rounded-lg text-[14px] font-medium text-gs-text focus:outline-none focus:border-gs-blue"
      />
    </div>
  );
}

/* ── Select ─────────────────────────────────────────────────────── */
export function GsSelect({ value }: { value: string }) {
  return (
    <div className="relative">
      <select className="w-full h-11 px-4 bg-gs-card border border-gs-border rounded-lg text-[14px] font-medium text-gs-text appearance-none focus:outline-none focus:border-gs-blue">
        <option>{value}</option>
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gs-muted pointer-events-none w-4 h-4" />
    </div>
  );
}

export function SelectGroup({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gs-muted uppercase tracking-wider mb-2">
        {label}
      </label>
      <GsSelect value={value} />
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────────────────────── */
export function ToggleRow({
  title,
  desc,
  enabled = false,
}: {
  title: string;
  desc: string;
  enabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="pr-10">
        <p className="text-[14px] font-bold text-gs-text mb-0.5">{title}</p>
        <p className="text-[12px] text-gs-muted">{desc}</p>
      </div>
      <div
        className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${
          enabled ? "bg-gs-blue" : "bg-gs-border"
        }`}
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
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string;
  count?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 group cursor-pointer border-b border-gs-border last:border-0">
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
