"use client";

import { useEffect } from "react";
import type { Project, SimulationListItem } from "../../types";
import { FilterDropdown } from "../ui/FilterDropdown";
import { FlagIcon, AUTHORITY_COUNTRY_CODE } from "../ui/FlagIcon";

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

export function SimulationScenario({
  project,
  authority, onAuthorityChange,
  submissionType, onSubmissionTypeChange,
  productType, onProductTypeChange,
  stage, onStageChange,
  focusArea, onFocusAreaChange,
  lastRun,
}: {
  project: Project | null;
  authority: string;          onAuthorityChange: (v: string) => void;
  submissionType: string;     onSubmissionTypeChange: (v: string) => void;
  productType: string;        onProductTypeChange: (v: string) => void;
  stage: string;              onStageChange: (v: string) => void;
  focusArea: string;          onFocusAreaChange: (v: string) => void;
  lastRun?: SimulationListItem | null;
}) {
  const availableAuthorities = project?.authorities?.length
    ? project.authorities.filter(a => AUTHORITIES.includes(a))
    : AUTHORITIES;

  const productTypeOptions = PRODUCT_TYPES_BY_SUBMISSION[submissionType] ?? DEFAULT_PRODUCT_TYPES;

  useEffect(() => {
    if (!productTypeOptions.includes(productType)) {
      onProductTypeChange(productTypeOptions[0] ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionType]);

  return (
    <div className="bg-gs-card rounded-xl border border-gs-border shadow-sm p-5 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-gs-text">Simulation Scenario</h2>
        <span className="text-[10px] uppercase tracking-wider font-bold text-gs-muted">
          {lastRun
            ? `Last run: ${new Date(lastRun.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`
            : "No runs yet"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
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
      </div>
    </div>
  );
}
