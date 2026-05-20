export type SimulationMode = "project" | "standalone";

export const SIMULATION_PURPOSES = [
  "Generate likely health authority questions",
  "Simulate meeting feedback",
  "Challenge sponsor positions",
  "Identify likely objections / concerns",
  "Assess regulatory readiness",
  "Review CMC risk",
  "Review clinical design risk",
  "Review nonclinical package risk",
  "Generate response strategy",
  "Compare authority expectations globally",
] as const;

export interface SourceDef {
  key: string;
  label: string;
}

// Keys must match the backend constants in simulation_service.py.
export const SOURCE_DEFS: SourceDef[] = [
  { key: "project_profile",        label: "Project Profile" },
  { key: "project_documents",      label: "Uploaded Project Documents" },
  { key: "supplemental_documents", label: "Supplemental Uploaded Documents" },
  { key: "prior_gap_assessment",   label: "Prior Global Gap Assessment" },
  { key: "chat_outputs",           label: "Saved Regulatory Chat Outputs" },
  { key: "regulatory_core",        label: "Regulatory Core / Project Intelligence" },
  { key: "pasted_questions",       label: "Pasted Questions / Sponsor Positions" },
  { key: "manual_scenario",        label: "Manual Scenario Inputs" },
  { key: "prior_simulations",      label: "Prior Simulation History" },
];

export const ALL_SOURCE_KEYS = SOURCE_DEFS.map((s) => s.key);

/** Build the run-button label from the selected purpose and scenario. */
export function runButtonLabel(
  purpose: string,
  authority: string,
  mode: SimulationMode,
  projectName?: string | null,
): string {
  if (purpose === "Generate likely health authority questions") return "Generate Authority Questions";
  if (purpose === "Simulate meeting feedback") return "Simulate Meeting Feedback";
  const base = `Run ${authority} Simulation`;
  return mode === "project" && projectName ? `${base} for ${projectName}` : base;
}
