export interface UserPreferences {
  language?: string;
  date_format?: string;
  number_format?: string;
  timezone?: string;
  job_title?: string;
  organization?: string;
  dark_mode?: boolean;
  ai_auto_summarize?: boolean;
  high_priority_alerts?: boolean;
  default_workspace_view?: string;
}

export interface BillingUsage {
  plan: string;
  uploads_this_month: number;
  upload_limit: number | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  account_type: "solo" | "organization_member";
  organization_id: string | null;
  created_at: string;
  preferences?: UserPreferences | null;
}

export interface AuditLog {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  resource_name: string | null;
  ip_address: string | null;
  created_at: string;
  user_email: string | null;
  user_full_name: string | null;
  details: Record<string, unknown> | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string | null;
  token_count: number | null;
  is_analysis?: boolean;
  analysis_data?: Record<string, unknown> | null;
  attached_filename?: string | null;
  attached_url?: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  model: string;
  chat_mode: string | null;
  is_temporary: boolean;
  system_prompt: string | null;
  project_id: string | null;
  project_name: string | null;
  organization_id: string | null;
  user_id: string | null;
  user_full_name: string | null;
  user_email: string | null;
  uploaded_filename: string | null;
  uploaded_url: string | null;
  uploaded_type: string | null;
  active_file_id: string | null;
  created_at: string;
  updated_at: string;
  messages: Message[];
  models_used: string[];
  category?: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  requires_verification?: boolean;
}

export type ProjectStatus = "On Track" | "At Risk" | "Planning";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  type: string;
  indication: string | null;
  therapeutic_area: string | null;
  dev_phase: string | null;
  status: ProjectStatus;
  readiness_score: number;
  authorities: string[] | null;
  product_type: string | null;
  icon_type: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  page_size: number;
}

export interface ProjectDocument {
  id: string;
  project_id: string | null;
  conversation_id: string | null;
  filename: string;
  file_type: string;
  authority: string | null;
  summary: string | null;
  source?: string | null;
  gap_count?: number;
  created_at: string;
}

export interface GapDomainReadiness {
  domain: string;
  readiness: number;
  difference: number;
}

export interface GapSeverityStat {
  severity: string;
  count: number;
  percentage: number;
}

export interface GapSummary {
  id: string;
  domain: string;
  title: string;
  severity: string;
  impact: string;
  status: string;
  why_this_matters?: string | null;
  health_authority_relevance?: string | null;
  source_evidence?: string | null;
  document_reference?: string | null;
  recommended_action?: string | null;
  suggested_owner?: string | null;
  target_date?: string | null;
  priority_level?: string | null;
}

export interface GapActionItem {
  title: string;
  description: string;
  priority: string;
}

export interface AnalyzedDocument {
  id: string;
  filename: string;
  authority: string | null;
  gap_count: number;
  confidence_score: number | null;
  created_at: string;
}

export interface AssessmentDocumentSummary {
  id: string;
  filename: string;
  file_type?: string | null;
  authority?: string | null;
  source?: string | null;
  created_at?: string | null;
}

export interface GapAssessmentResponse {
  overall_readiness: number;
  readiness_vs_last: number;
  critical_gaps_count: number;
  high_priority_count: number;
  recommendations_count: number;
  domain_readiness: GapDomainReadiness[];
  severity_distribution: GapSeverityStat[];
  top_gaps: GapSummary[];
  next_steps: GapActionItem[];
  documents_reviewed: AssessmentDocumentSummary[];
}

export interface GapAssessmentRun {
  id: string;
  project_id: string | null;
  source_type: string;
  assessment_type: string;
  regions: string[];
  document_ids: string[];
  documents_reviewed: AssessmentDocumentSummary[];
  confidence_level: string;
  readiness_score: number;
  critical_gaps_count: number;
  high_priority_count: number;
  recommendations_count: number;
  top_risks: string[];
  recommendations: string[];
  created_at: string;
  updated_at: string;
}

// ── HA Simulation ────────────────────────────────────────────────────────────

export interface SimQuestion {
  id: string;
  topic: string;
  severity: string;
  question: string;
  rationale: string;
  order_index: number;
}

export interface SimConcern {
  id: string;
  text: string;
  severity: string;
}

export interface SimFollowup {
  id: string;
  text: string;
}

export interface SimAction {
  id: string;
  text: string;
  priority: string;
}

export interface SimulationSession {
  id: string;
  project_id: string | null;
  authority: string;
  submission_type: string;
  product_type: string;
  stage: string;
  focus_area: string;
  total_questions: number;
  critical_count: number;
  key_concerns_count: number;
  readiness_score: number;
  confidence_level: string;
  feedback_summary: string | null;
  meeting_brief: string | null;
  response_guidance: string | null;
  questions: SimQuestion[];
  concerns: SimConcern[];
  followups: SimFollowup[];
  actions: SimAction[];
  created_at: string;
}

export interface SimulationListItem {
  id: string;
  project_id: string | null;
  project_name: string | null;
  authority: string;
  submission_type: string;
  stage: string;
  focus_area: string;
  total_questions: number;
  readiness_score: number;
  confidence_level: string;
  created_at: string;
}

export interface SimulationRunRequest {
  project_id?: string;
  authority: string;
  submission_type: string;
  product_type: string;
  stage: string;
  focus_area: string;
  mode?: string;
  simulation_purpose?: string;
  pasted_questions?: string;
  manual_scenario?: string;
  included_sources?: string[];
  supplemental_document_ids?: string[];
}

export interface StreamChunk {
  type: "delta" | "done" | "error" | "analysis" | "conversation_ready" | "title_update";
  content?: string;
  message_id?: string;
  conversation_id?: string;
  error?: string;
  data?: Record<string, unknown>;
  id?: string;
  model?: string;
  is_temporary?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── Organization / Tenant ─────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  org_email: string | null;
  owner_id: string;
  created_at: string;
}

export interface OrgMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "member";
  status: "active" | "invited";
  joined_at: string;
}

export interface InviteDetails {
  email: string;
  org_name: string;
  token: string;
}

// ── Subscription ──────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  plan: "trial" | "starter" | "professional" | "business" | "enterprise";
  billing_cycle: "monthly" | "annual";
  status: "trialing" | "active" | "expired" | "cancelled";
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end?: boolean;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  created_at: string;
}
