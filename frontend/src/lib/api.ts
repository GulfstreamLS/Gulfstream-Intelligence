import type { Conversation, StreamChunk, TokenResponse, User } from "../types";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/backend";

export function setTokenCookies(tokens: TokenResponse) {
  Cookies.set("access_token", tokens.access_token, { expires: 1 });
  Cookies.set("refresh_token", tokens.refresh_token, { expires: 30 });
}

export function clearTokenCookies() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

let isRefreshing = false;

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = Cookies.get("access_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && retry && !isRefreshing && path !== "/auth/refresh") {
    isRefreshing = true;
    try {
      const refreshToken = Cookies.get("refresh_token");
      if (refreshToken) {
        const tokens = await request<TokenResponse>(
          "/auth/refresh",
          { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
          false,
        );
        setTokenCookies(tokens);
        isRefreshing = false;
        return request<T>(path, init, false);
      }
    } catch {
      // refresh failed — fall through to logout
    }
    isRefreshing = false;
    clearTokenCookies();
    // TODO: Re-enable once backend is deployed
    // if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

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

  createConversation: (model = "gpt-4o", title?: string) =>
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

  updateAuthorities: (id: string, authorities: string[]) =>
    request<Conversation>(`/chat/conversations/${id}/authorities`, {
      method: "PATCH",
      body: JSON.stringify(authorities),
    }),

  uploadFile: async (conversationId: string, file: File): Promise<Record<string, unknown>> => {
    const token = Cookies.get("access_token");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // No Content-Type — browser sets it with multipart boundary
      },
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? `HTTP ${res.status}`);
    }
    return res.json();
  },

  async *send(params: {
    conversationId?: string | null;
    message?: string;
    file?: File;
    authorities?: string[];
    model?: string;
  }): AsyncGenerator<StreamChunk> {
    const token = Cookies.get("access_token");
    const form  = new FormData();
    if (params.conversationId) form.append("conversation_id", params.conversationId);
    if (params.message)        form.append("message",         params.message);
    if (params.authorities?.length) form.append("authorities", JSON.stringify(params.authorities));
    if (params.model)          form.append("model",           params.model);
    if (params.file)           form.append("file",            params.file);

    const res = await fetch(`${BASE_URL}/chat/send`, {
      method:  "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body:    form,
    });

    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const chunk = JSON.parse(line.slice(6)) as StreamChunk;
            yield chunk;
            if (chunk.type === "delta") {
              await new Promise<void>(resolve => setTimeout(resolve, 25));
            }
          } catch { /* skip malformed */ }
        }
      }
    }
  },

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
            const chunk = JSON.parse(line.slice(6)) as StreamChunk;
            yield chunk;
            // Wait for the next animation frame between delta chunks so the
            // browser paints each word before processing the next one.
            if (chunk.type === "delta") {
              await new Promise<void>(resolve => setTimeout(resolve, 25));
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    }
  },
};
