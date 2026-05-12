"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X, Plus } from "lucide-react";
import { lookupApi } from "../../lib/api";

interface DynamicSelectProps {
  category: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function DynamicSelect({
  category,
  value,
  onChange,
  placeholder = "Select…",
  className = "",
}: DynamicSelectProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lookupApi.list(category)
      .then(items => { setOptions(items); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [category]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        setShowInput(false);
        setInputVal("");
        setError("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    function updateMenuPosition() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const gap = 4;
      const margin = 16;
      const maxMenuHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
      const availableHeight = Math.max(120, Math.min(maxMenuHeight, openUp ? spaceAbove - gap : spaceBelow - gap));

      setMenuStyle({
        position: "fixed",
        left: rect.left,
        top: openUp ? rect.top - availableHeight - gap : rect.bottom + gap,
        width: rect.width,
        maxHeight: availableHeight,
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

  async function handleAdd() {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    setAdding(true);
    setError("");
    try {
      const saved = await lookupApi.add(category, trimmed);
      setOptions(prev => prev.includes(saved) ? prev : [...prev, saved]);
      onChange(saved);
      setOpen(false);
      setShowInput(false);
      setInputVal("");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  const visibleOptions = value && !options.includes(value)
    ? [value, ...options]
    : options;

  const dropdown = (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-gs-card border border-gs-border rounded-xl shadow-lg z-[9999] overflow-hidden py-1 overflow-y-auto"
    >
      {visibleOptions.length === 0 && !showInput && (
        <p className="px-4 py-3 text-xs text-gs-muted">No options yet.</p>
      )}

      {visibleOptions.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => { onChange(opt); setOpen(false); }}
          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
            opt === value
              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-semibold"
              : "text-gs-text hover:bg-gs-bg"
          }`}
        >
          <span>{opt}</span>
          {opt === value && <Check size={13} className="text-blue-600 shrink-0" />}
        </button>
      ))}

      {/* Divider + Add custom */}
      {loaded && (
        <>
          <div className="my-1 border-t border-gs-border" />
          {showInput ? (
            <div className="px-3 pb-3 pt-2 space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  autoFocus
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
                    if (e.key === "Escape") { setShowInput(false); setInputVal(""); setError(""); }
                  }}
                  placeholder="Type new value…"
                  className="min-w-0 flex-1 h-9 px-2.5 bg-gs-bg border border-gs-border rounded-lg text-sm text-gs-text placeholder:text-gs-muted focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding || !inputVal.trim()}
                  className="shrink-0 h-9 px-3 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-60"
                >
                  {adding ? "…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowInput(false); setInputVal(""); setError(""); }}
                  className="shrink-0 w-9 h-9 flex items-center justify-center border border-gs-border rounded-lg text-gs-muted hover:bg-gs-bg"
                >
                  <X size={13} />
                </button>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 font-semibold hover:bg-gs-bg transition-colors"
            >
              <Plus size={14} /> Add custom…
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={!loaded}
        onClick={() => setOpen(v => !v)}
        className="w-full h-10 px-3 flex items-center justify-between gap-2 bg-gs-card border border-gs-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60 cursor-pointer"
      >
        <span className={value ? "text-gs-text font-medium" : "text-gs-muted"}>
          {!loaded ? "Loading…" : (value || placeholder)}
        </span>
        <ChevronDown
          size={14}
          className={`text-gs-muted shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && mounted && createPortal(dropdown, document.body)}
    </div>
  );
}
