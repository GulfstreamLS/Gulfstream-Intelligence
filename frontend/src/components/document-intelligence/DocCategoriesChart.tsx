"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface AuthorityBucket {
  name: string;
  count: number;
}

interface Props {
  total: number;
  authorities: AuthorityBucket[];
}

const COLORS = ["#2563EB", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];
const DONUT_LIMIT = 4;

export function DocCategoriesChart({ total, authorities }: Props) {
  const [showAll, setShowAll] = useState(false);

  let cumulative = 0;
  const segments = authorities.slice(0, DONUT_LIMIT).map((a, i) => {
    const pct = total > 0 ? (a.count / total) * 100 : 0;
    const offset = -cumulative;
    cumulative += pct;
    return { ...a, pct, offset, color: COLORS[i % COLORS.length] };
  });

  const extraItems = authorities.slice(DONUT_LIMIT);
  const hasMore = extraItems.length > 0;

  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-8">Document Categories</h3>

      {total === 0 ? (
        <p className="text-[13px] text-gs-muted font-medium">No documents analyzed yet.</p>
      ) : (
        <>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                {segments.map((seg) => (
                  <circle
                    key={seg.name}
                    cx="18" cy="18" r="16"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="4"
                    strokeDasharray={`${seg.pct}, 100`}
                    strokeDashoffset={`${seg.offset}`}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[26px] font-black text-gs-text leading-none">{total}</span>
                <span className="text-[10px] font-bold text-gs-muted uppercase mt-1">Total</span>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {segments.map((seg) => (
                <div key={seg.name} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-[11px] font-bold text-gs-muted whitespace-nowrap">{seg.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-gs-text">
                    {seg.count} <span className="font-bold text-gs-muted ml-1">({Math.round(seg.pct)}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {showAll && (
            <div className="mt-4 space-y-2 border-t border-gs-border pt-4">
              {extraItems.map((a, i) => (
                <div key={a.name} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[(DONUT_LIMIT + i) % COLORS.length] }} />
                    <span className="text-[11px] font-bold text-gs-muted whitespace-nowrap">{a.name}</span>
                  </div>
                  <span className="text-[11px] font-black text-gs-text">
                    {a.count} <span className="font-bold text-gs-muted ml-1">({total > 0 ? Math.round((a.count / total) * 100) : 0}%)</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-gs-blue text-[13px] font-bold flex items-center gap-1 mt-6 hover:underline"
            >
              {showAll ? "Show less" : `View all categories (${authorities.length})`}
              {showAll ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </>
      )}
    </div>
  );
}
