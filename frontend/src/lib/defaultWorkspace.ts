export const DEFAULT_WORKSPACE_OPTIONS = [
  { label: "Home", value: "home", href: "/dashboard" },
  { label: "Regulatory Chat", value: "regulatory_chat", href: "/dashboard/chat" },
  { label: "Global Gap Assessment", value: "global_gap_assessment", href: "/dashboard/gap-assessment" },
  { label: "Health Authority Simulation", value: "health_authority_simulation", href: "/dashboard/ha-simulation" },
  { label: "Document Intelligence", value: "document_intelligence", href: "/dashboard/documents" },
  { label: "Projects", value: "projects", href: "/dashboard/projects" },
  { label: "History", value: "history", href: "/dashboard/history" },
  { label: "Settings", value: "settings", href: "/dashboard/settings" },
] as const;

export function defaultWorkspaceHref(value?: string | null) {
  return DEFAULT_WORKSPACE_OPTIONS.find((option) => option.value === value || option.label === value)?.href ?? "/dashboard";
}
