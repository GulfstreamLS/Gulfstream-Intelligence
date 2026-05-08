export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
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
  system_prompt: string | null;
  project_id: string | null;
  project_name: string | null;
  uploaded_filename: string | null;
  uploaded_url: string | null;
  uploaded_type: string | null;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type ProjectStatus = "On Track" | "At Risk" | "Planning";

export interface Project {
  id: string;
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
  created_at: string;
  updated_at: string;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  page_size: number;
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
  created_at: string;
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
}

export interface StreamChunk {
  type: "delta" | "done" | "error" | "analysis" | "conversation_ready";
  content?: string;
  message_id?: string;
  conversation_id?: string;
  error?: string;
  data?: Record<string, unknown>;
  // conversation_ready fields
  id?: string;
  model?: string;
  created_at?: string;
  updated_at?: string;
}
