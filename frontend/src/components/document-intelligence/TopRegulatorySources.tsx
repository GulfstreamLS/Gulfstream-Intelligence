"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface AuthorityBucket {
  name: string;
  count: number;
}

interface Props {
  sources: AuthorityBucket[];
}

const DEFAULT_LIMIT = 4;

function SourceItem({ name, count }: AuthorityBucket) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[13px] font-bold text-gs-muted">{name}</span>
      <span className="bg-gs-bg px-2 py-0.5 rounded text-[11px] font-black text-gs-blue border border-gs-border">
        {count}
      </span>
    </div>
  );
}

export function TopRegulatorySources({ sources }: Props) {
  const [showAll, setShowAll] = useState(false);

  const visible  = showAll ? sources : sources.slice(0, DEFAULT_LIMIT);
  const hasMore  = sources.length > DEFAULT_LIMIT;

  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-6">Top Regulatory Sources</h3>

      {sources.length === 0 ? (
        <p className="text-[13px] text-gs-muted font-medium">No sources yet.</p>
      ) : (
        <>
          <div className="space-y-[10px]">
            {visible.map((s) => (
              <SourceItem key={s.name} name={s.name} count={s.count} />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-gs-blue text-[13px] font-bold flex items-center gap-1 mt-6 hover:underline"
            >
              {showAll ? "Show less" : `View all sources (${sources.length})`}
              {showAll ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </>
      )}
    </div>
  );
}
