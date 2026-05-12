"use client";

import type { GapDomainReadiness } from "../../types";

interface Props {
  domains: GapDomainReadiness[];
}

export function KeyTopicsDetected({ domains }: Props) {
  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-6">Key Topics Detected</h3>

      {domains.length === 0 ? (
        <p className="text-[13px] text-gs-muted font-medium">
          No topics detected yet.
        </p>
      ) : (
        <div className="space-y-[10px]">
          {domains.map((d) => (
            <div key={d.domain} className="flex items-center justify-between py-1">
              <span className="text-[13px] font-bold text-gs-muted">{d.domain}</span>
              <span className="bg-gs-bg px-2 py-0.5 rounded text-[11px] font-black text-gs-blue border border-gs-border">
                {d.readiness}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
