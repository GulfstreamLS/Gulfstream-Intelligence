"use client";

import { Check, Layers } from "lucide-react";
import { SOURCE_DEFS, type SimulationMode } from "./simulationConstants";

function InfoRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gs-border last:border-0">
      <span className="text-[11px] font-bold text-gs-muted uppercase tracking-wider shrink-0">{label}</span>
      <span className={`text-[13px] font-semibold text-right truncate ${muted ? "text-gs-muted" : "text-gs-text"}`}>
        {value}
      </span>
    </div>
  );
}

export function SourceContextSummary({
  mode,
  projectName,
  authority,
  submissionType,
  focusArea,
  simulationPurpose,
  includedSources,
  onToggleSource,
  sourceCounts,
}: {
  mode: SimulationMode;
  projectName: string | null;
  authority: string;
  submissionType: string;
  focusArea: string;
  simulationPurpose: string;
  includedSources: string[];
  onToggleSource: (key: string) => void;
  sourceCounts: Record<string, number | null>;
}) {
  return (
    <div className="lg:col-span-6 bg-gs-card rounded-xl border border-gs-border shadow-sm p-6">
      <h3 className="font-bold text-gs-text mb-4">Source Context Summary</h3>

      <div className="mb-5">
        <InfoRow label="Mode" value={mode === "project" ? "Project-Based" : "Standalone"} />
        <InfoRow
          label="Project"
          value={mode === "project" ? (projectName ?? "None selected") : "—"}
          muted={mode === "project" ? !projectName : true}
        />
        <InfoRow label="Health Authority" value={authority} />
        <InfoRow label="Submission Type" value={submissionType} />
        <InfoRow label="Focus Area" value={focusArea} />
        <InfoRow
          label="Simulation Purpose"
          value={simulationPurpose || "Not selected"}
          muted={!simulationPurpose}
        />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Layers size={14} className="text-indigo-500" />
        <h4 className="text-[12px] font-bold text-gs-text uppercase tracking-wider">Sources Included</h4>
      </div>
      <p className="text-[11px] text-gs-muted mb-3">
        Choose which sources feed this simulation.
      </p>

      <div className="space-y-1">
        {SOURCE_DEFS.map(({ key, label }) => {
          const checked = includedSources.includes(key);
          const count = sourceCounts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleSource(key)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gs-bg transition-colors text-left"
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                checked ? "bg-indigo-600 border-indigo-600" : "border-gs-border"
              }`}>
                {checked && <Check size={11} className="text-white" />}
              </span>
              <span className={`flex-1 min-w-0 text-[12px] font-semibold truncate ${
                checked ? "text-gs-text" : "text-gs-muted"
              }`}>
                {label}
              </span>
              <span className="text-[11px] font-bold text-gs-muted shrink-0">
                {count == null ? "—" : count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
