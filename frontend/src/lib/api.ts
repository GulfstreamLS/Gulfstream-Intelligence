import type { Conversation, StreamChunk, TokenResponse, User } from "@/types";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/backend";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = Cookies.get("access_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const authApi = {
  register: (email: string, password: string, full_name?: string) =>
    request<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    }),

  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>("/auth/me"),

  refresh: (refresh_token: string) =>
    request<TokenResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),
};

export const chatApi = {
  listConversations: () => request<Conversation[]>("/chat/conversations"),

  createConversation: (model = "claude-sonnet-4-6", title?: string) =>
    request<Conversation>("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ model, title }),
    }),

  getConversation: (id: string) => request<Conversation>(`/chat/conversations/${id}`),

  updateConversation: (id: string, data: { title?: string; system_prompt?: string }) =>
    request<Conversation>(`/chat/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteConversation: (id: string) =>
    request<void>(`/chat/conversations/${id}`, { method: "DELETE" }),

  async *sendMessage(
    conversationId: string,
    message: string,
    model?: string,
  ): AsyncGenerator<StreamChunk> {
    const token = Cookies.get("access_token");
    const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, model, stream: true }),
    });

    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            yield JSON.parse(line.slice(6)) as StreamChunk;
          } catch {
            // skip malformed chunk
          }
        }
      }
    }
  },
};
