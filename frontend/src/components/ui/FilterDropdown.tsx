"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
  optionIcon?: React.ReactNode;
}

interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  icon?: React.ReactNode;
  label?: string;
  placeholder?: string;
  className?: string;
  fullWidth?: boolean;
}

export function FilterDropdown({ value, onChange, options, icon, label, placeholder, className = "", fullWidth = false }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    function updateMenuPosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const margin = 8;
      const boundary = ref.current?.closest("[data-dropdown-boundary]");
      const boundaryRect = boundary?.getBoundingClientRect();
      const minTop = Math.max(margin, boundaryRect?.top ?? margin);
      const maxBottom = Math.min(window.innerHeight - margin, boundaryRect?.bottom ?? window.innerHeight - margin);
      const availableBelow = maxBottom - rect.bottom - 6;
      const availableAbove = rect.top - minTop - 6;
      const openUp = !boundary && availableBelow < 220 && availableAbove > availableBelow;
      const maxHeight = Math.max(120, Math.min(320, openUp ? availableAbove : availableBelow));
      const left = Math.max(margin, Math.min(rect.left, window.innerWidth - margin - rect.width));

      setMenuStyle({
        position: "fixed",
        left,
        top: openUp ? undefined : Math.max(minTop, rect.bottom + 6),
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        minWidth: rect.width,
        maxWidth: Math.min(420, window.innerWidth - left - margin),
        maxHeight,
        zIndex: 10000,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`relative ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <p className="text-xs font-bold text-gs-muted uppercase mb-2">{label}</p>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 bg-gs-card border border-gs-border rounded-lg px-3 py-2 hover:bg-gs-bg transition-colors min-h-[40px] cursor-pointer ${fullWidth ? "w-full justify-between" : ""}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-gs-muted shrink-0">{icon}</span>}
          {selected?.optionIcon && <span className="shrink-0">{selected.optionIcon}</span>}
          <span className={`text-sm font-semibold truncate ${selected || value ? "text-gs-text" : "text-gs-muted"}`}>
            {selected?.label ?? (value || placeholder || "")}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`text-gs-muted ml-1 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="bg-gs-card border border-gs-border rounded-xl shadow-lg overflow-y-auto py-1.5"
        >
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
                <span className="flex items-center gap-2">
                  {opt.optionIcon && <span className="shrink-0">{opt.optionIcon}</span>}
                  <span>{opt.label}</span>
                </span>
                {active && <Check size={13} className="text-gs-blue shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
