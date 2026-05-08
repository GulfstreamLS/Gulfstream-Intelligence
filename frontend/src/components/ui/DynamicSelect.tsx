"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    lookupApi.list(category)
      .then(items => { setOptions(items); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [category]);

  async function handleAdd() {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    setAdding(true);
    setError("");
    try {
      const saved = await lookupApi.add(category, trimmed);
      setOptions(prev => prev.includes(saved) ? prev : [...prev, saved]);
      onChange(saved);
      setShowInput(false);
      setInputVal("");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  const baseClass =
    "w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white";

  // Always keep current value in the list so the select renders correctly while loading
  const visibleOptions = value && !options.includes(value)
    ? [value, ...options]
    : options;

  if (showInput) {
    return (
      <div className="space-y-1">
        <div className="flex gap-1.5 w-full">
          <input
            autoFocus
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
              if (e.key === "Escape") { setShowInput(false); setInputVal(""); setError(""); }
            }}
            placeholder="Type new value…"
            className="min-w-0 flex-1 h-10 px-3 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !inputVal.trim()}
            className="shrink-0 h-10 px-3 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-60"
          >
            {adding ? "…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setShowInput(false); setInputVal(""); setError(""); }}
            className="shrink-0 w-9 h-10 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50"
          >
            <X size={13} />
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <select
      value={value}
      disabled={!loaded}
      onChange={e => {
        if (e.target.value === "__other__") {
          setShowInput(true);
        } else {
          onChange(e.target.value);
        }
      }}
      className={`${className || baseClass} ${!loaded ? "opacity-60" : ""}`}
    >
      {!value && <option value="">{loaded ? placeholder : "Loading…"}</option>}
      {visibleOptions.map(o => <option key={o} value={o}>{o}</option>)}
      {loaded && (
        <>
          <option disabled>─────────</option>
          <option value="__other__">+ Add custom…</option>
        </>
      )}
    </select>
  );
}
