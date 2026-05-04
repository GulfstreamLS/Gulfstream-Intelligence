export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
  timestamp: string;
  sources?: string[];
}
