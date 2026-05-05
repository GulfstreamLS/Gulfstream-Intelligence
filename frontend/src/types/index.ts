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
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  model: string;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
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
