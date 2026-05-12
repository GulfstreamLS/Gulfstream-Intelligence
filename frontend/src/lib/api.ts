import type { AuditLog, AnalyzedDocument, AppNotification, Conversation, GapAssessmentResponse, InviteDetails, OrgMember, Organization, Project, ProjectListResponse, SimulationListItem, SimulationRunRequest, SimulationSession, StreamChunk, Subscription, TokenResponse, User, UserPreferences } from "../types";
import Cookies from "js-cookie";

interface BillingPlan {
  id: string;
  name: string;
  description: string;
  monthly_price: number | null;
  annual_price: number | null;
  features: string[];
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://gulfstream-backend-y7fj7rtwsa-uc.a.run.app/api/v1";

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
  const isAuthEndpoint = path === "/auth/login" || path === "/auth/register" || path === "/auth/refresh";
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && retry && !isRefreshing && !isAuthEndpoint) {
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
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
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

  registerFull: (data: {
    email: string;
    password: string;
    full_name?: string;
    account_type?: string;
    org_name?: string;
    org_email?: string;
  }) =>
    request<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
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

  updateProfile: (data: { full_name?: string; preferences?: UserPreferences }) =>
    request<User>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updatePassword: (current_password: string, new_password: string) =>
    request<void>("/auth/me/password", {
      method: "PATCH",
      body: JSON.stringify({ current_password, new_password }),
    }),

  getActivity: (limit = 20, offset = 0) =>
    request<AuditLog[]>(`/auth/me/activity?limit=${limit}&offset=${offset}`),

  verifyEmail: (userId: string, code: string) =>
    request<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, code }),
    }),

  resendVerification: () =>
    request<{ message: string }>("/auth/resend-verification", { method: "POST" }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
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

  updateConversation: (id: string, data: { title?: string; system_prompt?: string; project_id?: string | null; model?: string }) =>
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

  transcribeAudio: async (blob: Blob): Promise<string> => {
    const token = Cookies.get("access_token");
    const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm";
    const formData = new FormData();
    formData.append("audio", blob, `recording.${ext}`);
    const res = await fetch(`${BASE_URL}/chat/transcribe`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.text as string;
  },

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
    projectId?: string;
  }): AsyncGenerator<StreamChunk> {
    const token = Cookies.get("access_token");
    const form  = new FormData();
    if (params.conversationId) form.append("conversation_id", params.conversationId);
    if (params.message)        form.append("message",         params.message);
    if (params.authorities?.length) form.append("authorities", JSON.stringify(params.authorities));
    if (params.model)          form.append("model",           params.model);
    if (params.file)           form.append("file",            params.file);
    if (params.projectId)      form.append("project_id",      params.projectId);

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

type ProjectPayload = {
  name: string;
  type?: string;
  indication?: string | null;
  therapeutic_area?: string | null;
  dev_phase?: string | null;
  status?: Project["status"];
  readiness_score?: number;
  authorities?: string[] | null;
  product_type?: string | null;
  icon_type?: string | null;
};

export const projectApi = {
  list: (params?: { page?: number; page_size?: number; search?: string; status_filter?: string; authority?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.page_size) q.set("page_size", String(params.page_size));
    if (params?.search) q.set("search", params.search);
    if (params?.status_filter) q.set("status_filter", params.status_filter);
    if (params?.authority) q.set("authority", params.authority);
    return request<ProjectListResponse>(`/projects?${q.toString()}`);
  },

  get: (id: string) => request<Project>(`/projects/${id}`),

  create: (data: ProjectPayload) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<ProjectPayload>) =>
    request<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: string) => request<void>(`/projects/${id}`, { method: "DELETE" }),

  getConversations: (id: string) => request<Conversation[]>(`/projects/${id}/conversations`),

  importExcel: async (file: File): Promise<{ created: number; errors: string[] }> => {
    const token = Cookies.get("access_token");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/projects/import`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? `HTTP ${res.status}`);
    }
    return res.json();
  },
};

export const assessmentApi = {
  listDocuments: () => request<AnalyzedDocument[]>("/assessments/documents"),

  getGlobalGap: (authority?: string, documentId?: string) => {
    const params = new URLSearchParams();
    if (authority) params.set("authority", authority);
    if (documentId) params.set("document_id", documentId);
    const q = params.toString() ? `?${params.toString()}` : "";
    return request<GapAssessmentResponse>(`/assessments/global-gap${q}`);
  },
};

export const lookupApi = {
  list: (category: string): Promise<string[]> =>
    request<string[]>(`/lookups/${category}`),

  add: (category: string, value: string): Promise<string> =>
    request<string>(`/lookups/${category}`, {
      method: "POST",
      body: JSON.stringify({ value }),
    }),
};

export const simulationApi = {
  run: (body: SimulationRunRequest) =>
    request<SimulationSession>("/simulation/run", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listSessions: (projectId?: string) => {
    const q = projectId ? `?project_id=${projectId}` : "";
    return request<SimulationListItem[]>(`/simulation/sessions${q}`);
  },

  getSession: (id: string) =>
    request<SimulationSession>(`/simulation/sessions/${id}`),

  deleteSession: (id: string) =>
    request<void>(`/simulation/sessions/${id}`, { method: "DELETE" }),
};

export const organizationApi = {
  get: () => request<Organization>("/organizations/me"),

  update: (data: { name?: string; org_email?: string }) =>
    request<Organization>("/organizations/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  listMembers: () => request<OrgMember[]>("/organizations/me/members"),

  inviteMember: (email: string, full_name?: string) =>
    request<{ message: string; invite_id: string }>("/organizations/me/invites", {
      method: "POST",
      body: JSON.stringify({ email, full_name: full_name || undefined }),
    }),

  cancelInvite: (inviteId: string) =>
    request<void>(`/organizations/me/invites/${inviteId}`, { method: "DELETE" }),

  updateMemberRole: (userId: string, role: "owner" | "member") =>
    request<OrgMember>(`/organizations/me/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  removeMember: (userId: string) =>
    request<void>(`/organizations/me/members/${userId}`, { method: "DELETE" }),

  deleteOrg: (confirmName: string) =>
    request<void>("/organizations/me", {
      method: "DELETE",
      body: JSON.stringify({ confirm_name: confirmName }),
    }),
};

export const subscriptionApi = {
  get: () => request<Subscription | null>("/billing/status"),

  getUsage: () => request<import("../types").BillingUsage>("/billing/usage"),

  contactSales: (data: { name: string; email: string; company?: string; message: string }) =>
    request<{ message: string }>("/auth/contact-sales", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export const notificationApi = {
  list: (limit = 20) =>
    request<AppNotification[]>(`/notifications?limit=${limit}`),

  unreadCount: () =>
    request<{ count: number }>("/notifications/unread-count"),

  markRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllRead: () =>
    request<void>("/notifications/read-all", { method: "PATCH" }),
};

export const inviteApi = {
  getDetails: (token: string) =>
    request<InviteDetails>(`/auth/invite/${token}`),

  accept: (token: string, password: string, full_name?: string) =>
    request<TokenResponse>(`/auth/invite/${token}/accept`, {
      method: "POST",
      body: JSON.stringify({ password, full_name: full_name || undefined }),
    }),
};

export const billingApi = {
  createCheckoutSession: (plan_id: string, billing_cycle: string, success_url: string, cancel_url: string) =>
    request<{ checkout_url: string }>("/billing/checkout-session", {
      method: "POST",
      body: JSON.stringify({ plan_id, billing_cycle, success_url, cancel_url }),
    }),

  getStatus: () => request<Subscription | null>("/billing/status"),

  getPlans: () => request<{
    solo: BillingPlan[];
    organization: BillingPlan[];
  }>("/billing/plans"),

  syncSubscription: () => request<{ message: string }>("/billing/sync"),

  reactivateSubscription: () => request<{ message: string }>("/billing/reactivate", {
    method: "POST"
  }),

  cancelSubscription: () => request<{ message: string }>("/billing/cancel", {
    method: "POST"
  }),
};
