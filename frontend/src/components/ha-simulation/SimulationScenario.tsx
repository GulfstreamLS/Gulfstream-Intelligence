"use client";

import { useEffect } from "react";
import { Folder, User } from "lucide-react";
import type { Project, SimulationListItem } from "../../types";
import { FilterDropdown } from "../ui/FilterDropdown";
import { FlagIcon, AUTHORITY_COUNTRY_CODE } from "../ui/FlagIcon";
import { SIMULATION_PURPOSES, type SimulationMode } from "./simulationConstants";

const AUTHORITIES = ["FDA", "EMA", "MHRA", "Health Canada", "PMDA", "NMPA", "TGA"];
const SUBMISSION_TYPES = ["IND", "NDA", "BLA", "MAA", "ANDA", "510(k)", "PMA"];
const STAGES           = ["Preclinical", "Phase 1", "Phase 2", "Phase 3", "Pre-submission", "Post-approval"];
const FOCUS_AREAS      = ["CMC & Manufacturing", "Nonclinical", "Clinical Plan", "Quality Systems", "Regulatory Strategy"];

const PRODUCT_TYPES_BY_SUBMISSION: Record<string, string[]> = {
  IND:      ["Small Molecule", "Biologic", "Cell & Gene Therapy", "Vaccine", "Radiopharmaceutical"],
  NDA:      ["Small Molecule", "Combination Product"],
  BLA:      ["Biologic", "Cell & Gene Therapy", "Gene Therapy", "Vaccine"],
  MAA:      ["Small Molecule", "Biologic", "Cell & Gene Therapy", "Vaccine"],
  ANDA:     ["Small Molecule"],
  "510(k)": ["Medical Device", "Combination Product"],
  PMA:      ["Medical Device", "Combination Product"],
};
const DEFAULT_PRODUCT_TYPES = ["Small Molecule", "Biologic", "Cell & Gene Therapy", "Medical Device", "Combination Product", "Vaccine"];

function authorityOptions(list: string[]) {
  return list.map(a => ({
    value: a,
    label: a,
    optionIcon: AUTHORITY_COUNTRY_CODE[a]
      ? <FlagIcon code={AUTHORITY_COUNTRY_CODE[a]} size={18} alt={a} />
      : undefined,
  }));
}

function ModeToggle({ mode, onChange }: { mode: SimulationMode; onChange: (m: SimulationMode) => void }) {
  const options: { value: SimulationMode; label: string; icon: React.ElementType }[] = [
    { value: "project",    label: "Project-Based", icon: Folder },
    { value: "standalone", label: "Standalone",    icon: User },
  ];
  return (
    <div className="inline-flex rounded-lg border border-gs-border bg-gs-bg p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
            mode === value
              ? "bg-gs-card text-indigo-600 shadow-sm"
              : "text-gs-muted hover:text-gs-text"
          }`}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}

export function SimulationScenario({
  project, projects, onProjectSelect,
  mode, onModeChange,
  authority, onAuthorityChange,
  submissionType, onSubmissionTypeChange,
  productType, onProductTypeChange,
  stage, onStageChange,
  focusArea, onFocusAreaChange,
  simulationPurpose, onSimulationPurposeChange,
  lastRun,
  authoritiesList = AUTHORITIES,
}: {
  project: Project | null;
  projects: Project[];
  onProjectSelect: (p: Project | null) => void;
  mode: SimulationMode;            onModeChange: (m: SimulationMode) => void;
  authority: string;              onAuthorityChange: (v: string) => void;
  submissionType: string;         onSubmissionTypeChange: (v: string) => void;
  productType: string;            onProductTypeChange: (v: string) => void;
  stage: string;                  onStageChange: (v: string) => void;
  focusArea: string;              onFocusAreaChange: (v: string) => void;
  simulationPurpose: string;      onSimulationPurposeChange: (v: string) => void;
  lastRun?: SimulationListItem | null;
  authoritiesList?: string[];
}) {
  const availableAuthorities = project?.authorities?.length
    ? project.authorities.filter(a => authoritiesList.includes(a))
    : authoritiesList;

  const productTypeOptions = PRODUCT_TYPES_BY_SUBMISSION[submissionType] ?? DEFAULT_PRODUCT_TYPES;

  useEffect(() => {
    if (!productTypeOptions.includes(productType)) {
      onProductTypeChange(productTypeOptions[0] ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionType]);

  return (
    <div className="bg-gs-card rounded-xl border border-gs-border shadow-sm p-5 mb-8">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="font-bold text-gs-text">Simulation Scenario</h2>
        <div className="flex items-center gap-3">
          <ModeToggle mode={mode} onChange={onModeChange} />
          <span className="text-[10px] uppercase tracking-wider font-bold text-gs-muted">
            {lastRun
              ? `Last run: ${new Date(lastRun.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`
              : "No runs yet"}
          </span>
        </div>
      </div>

      {mode === "project" && (
        <div className="mb-6">
          <FilterDropdown
            label="Project"
            fullWidth
            icon={<Folder size={14} className="text-indigo-500" />}
            value={project?.id ?? ""}
            placeholder="Select a project…"
            onChange={(id) => onProjectSelect(projects.find(p => p.id === id) ?? null)}
            options={projects.map(p => ({ value: p.id, label: p.name }))}
          />
          <p className="text-[11px] text-gs-muted mt-1.5">
            The selected project is the primary source of truth for this simulation.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
        <FilterDropdown
          label="Health Authority"
          fullWidth
          value={authority}
          onChange={onAuthorityChange}
          options={authorityOptions(availableAuthorities)}
        />

        <FilterDropdown
          label="Submission Type"
          fullWidth
          value={submissionType}
          onChange={next => {
            onSubmissionTypeChange(next);
            const opts = PRODUCT_TYPES_BY_SUBMISSION[next] ?? DEFAULT_PRODUCT_TYPES;
            if (!opts.includes(productType)) onProductTypeChange(opts[0] ?? "");
          }}
          options={SUBMISSION_TYPES.map(o => ({ value: o, label: o }))}
        />

        <FilterDropdown
          label="Product Type"
          fullWidth
          value={productTypeOptions.includes(productType) ? productType : (productTypeOptions[0] ?? "")}
          onChange={onProductTypeChange}
          options={productTypeOptions.map(o => ({ value: o, label: o }))}
        />

        <FilterDropdown
          label="Stage"
          fullWidth
          value={stage}
          onChange={onStageChange}
          options={STAGES.map(o => ({ value: o, label: o }))}
        />

        <FilterDropdown
          label="Focus Area"
          fullWidth
          value={focusArea}
          onChange={onFocusAreaChange}
          options={FOCUS_AREAS.map(o => ({ value: o, label: o }))}
        />

        <FilterDropdown
          label="Simulation Purpose *"
          fullWidth
          value={simulationPurpose}
          placeholder="Select purpose…"
          onChange={onSimulationPurposeChange}
          options={SIMULATION_PURPOSES.map(o => ({ value: o, label: o }))}
        />
      </div>
    </div>
  );
}
