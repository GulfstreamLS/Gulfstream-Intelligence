export interface AnalysisAuthority {
  summary: string;
  insights: Array<{ content: string; category: string | null }>;
  gaps: Array<{
    title: string;
    domain: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    description: string;
    regulatory_impact: string;
    recommended_action: string;
    quoted_excerpt?: string | null;
    page_reference?: string | null;
  }>;
  risks: string[];
  actions: Array<{ title: string; description: string; priority: string }>;
  confidence_score: number;
  source_basis: string;
}

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
  timestamp: string;
  sources?: string[];
  isAnalysis?: boolean;
  analysisData?: Record<string, AnalysisAuthority>;
  attachmentName?: string;
  attachedFilename?: string | null;
  attachedUrl?: string | null;
}
