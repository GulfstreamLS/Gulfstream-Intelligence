"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  icon?: React.ReactNode;
  className?: string;
}

export function FilterDropdown({ value, onChange, options, icon, className = "" }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-gs-card border border-gs-border rounded-lg px-3 py-2 hover:bg-gs-bg transition-colors min-h-[40px] cursor-pointer"
      >
        {icon && <span className="text-gs-muted shrink-0">{icon}</span>}
        <span className="text-sm font-semibold text-gs-text whitespace-nowrap">{selected?.label ?? value}</span>
        <ChevronDown
          size={14}
          className={`text-gs-muted ml-1 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 min-w-[160px] w-max bg-gs-card border border-gs-border rounded-xl shadow-lg z-50 overflow-hidden py-1.5">
          {options.map(opt => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-gs-blue/10 dark:bg-gs-blue/20 text-gs-blue font-semibold"
                    : "text-gs-text hover:bg-gs-bg font-medium"
                }`}
              >
                <span>{opt.label}</span>
                {active && <Check size={13} className="text-gs-blue shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
