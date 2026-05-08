"use client";

import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import type { Project, SimulationListItem } from "../../types";

const AUTHORITIES = ["FDA", "EMA", "MHRA", "Health Canada", "PMDA", "NMPA", "TGA"];
const AUTHORITY_FLAGS: Record<string, string> = {
  FDA: "🇺🇸", EMA: "🇪🇺", MHRA: "🇬🇧", "Health Canada": "🇨🇦",
  PMDA: "🇯🇵", NMPA: "🇨🇳", TGA: "🇦🇺",
};
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

function SelectField({
  label, value, options, onChange,
}: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none p-2.5 border border-slate-200 rounded-lg text-sm font-medium bg-white pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronRight size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
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
  const authorityOptions = project?.authorities?.length
    ? project.authorities.filter(a => AUTHORITIES.includes(a))
    : AUTHORITIES;

  const productTypeOptions = PRODUCT_TYPES_BY_SUBMISSION[submissionType] ?? DEFAULT_PRODUCT_TYPES;

  // Auto-reset product type when submission type options change
  useEffect(() => {
    if (!productTypeOptions.includes(productType)) {
      onProductTypeChange(productTypeOptions[0] ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionType]);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-slate-800">Simulation Scenario</h2>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
          {lastRun
            ? `Last run: ${new Date(lastRun.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`
            : "No runs yet"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
        {/* Authority */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Health Authority</label>
          <div className="relative">
            <select
              value={authority}
              onChange={e => onAuthorityChange(e.target.value)}
              className="w-full appearance-none p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm font-medium pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            >
              {authorityOptions.map(a => (
                <option key={a} value={a}>{AUTHORITY_FLAGS[a] ?? ""} {a}</option>
              ))}
            </select>
            <ChevronRight size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Submission Type — changing this resets product type */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Submission Type</label>
          <div className="relative">
            <select
              value={submissionType}
              onChange={e => {
                const next = e.target.value;
                onSubmissionTypeChange(next);
                const opts = PRODUCT_TYPES_BY_SUBMISSION[next] ?? DEFAULT_PRODUCT_TYPES;
                if (!opts.includes(productType)) onProductTypeChange(opts[0] ?? "");
              }}
              className="w-full appearance-none p-2.5 border border-slate-200 rounded-lg text-sm font-medium bg-white pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            >
              {SUBMISSION_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronRight size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Product Type — options filtered by submission type */}
        <SelectField
          label="Product Type"
          value={productTypeOptions.includes(productType) ? productType : (productTypeOptions[0] ?? "")}
          options={productTypeOptions}
          onChange={onProductTypeChange}
        />

        <SelectField label="Stage"      value={stage}      options={STAGES}      onChange={onStageChange} />
        <SelectField label="Focus Area" value={focusArea}  options={FOCUS_AREAS} onChange={onFocusAreaChange} />
      </div>
    </div>
  );
}
