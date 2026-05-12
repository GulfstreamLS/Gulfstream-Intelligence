export const DEFAULT_CHAT_MODEL = "gpt-5";

export const CHAT_MODELS = [
  { id: "gpt-5", label: "GPT", provider: "OpenAI" },
  { id: "claude-sonnet-4-6", label: "Claude", provider: "Anthropic" },
] as const;

export type ChatModelId = (typeof CHAT_MODELS)[number]["id"];

export function isChatModelId(value: string): value is ChatModelId {
  return CHAT_MODELS.some((model) => model.id === value);
}

export function getChatModelLabel(value: string): string {
  return CHAT_MODELS.find((model) => model.id === value)?.label ?? value;
}
