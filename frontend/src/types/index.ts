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
