"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const SESSION_KEY = "gs_admin_authed";
const ADMIN_KEY   = "gs-admin-k3y-2026";
const BASE_URL    =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://gulfstream-backend-y7fj7rtwsa-uc.a.run.app/api/v1";

const SOLO_PLANS = ["trial", "starter", "professional"];
const ORGANIZATION_PLANS = ["trial", "business", "enterprise"];

interface AdminUser {
  id:                 string;
  email:              string;
  full_name:          string | null;
  account_type:       string;
  organization_id:    string | null;
  organization_role:  "owner" | "member" | null;
  can_manage_subscription: boolean;
  subscription_scope: string | null;
  is_active:          boolean;
  created_at:         string | null;
  subscription_id:    string | null;
  plan:               string | null;
  status:             string | null;
  trial_ends_at:      string | null;
  current_period_end: string | null;
}

function adminFetch(path: string, options: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key":  ADMIN_KEY,
      ...(options.headers ?? {}),
    },
  });
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    trialing:  "bg-blue-900 text-blue-300",
    active:    "bg-green-900 text-green-300",
    expired:   "bg-red-900 text-red-300",
    cancelled: "bg-gray-700 text-gray-400",
  };
  const cls = map[status ?? ""] ?? "bg-gray-700 text-gray-400";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {status ?? "none"}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string | null }) {
  const map: Record<string, string> = {
    trial:        "bg-yellow-900 text-yellow-300",
    starter:      "bg-gray-700 text-gray-300",
    professional: "bg-purple-900 text-purple-300",
    business:     "bg-indigo-900 text-indigo-300",
    enterprise:   "bg-pink-900 text-pink-300",
  };
  const cls = map[plan ?? ""] ?? "bg-gray-700 text-gray-400";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {plan ?? "none"}
    </span>
  );
}

function plansForUser(user: AdminUser) {
  return user.account_type === "organization_member" || user.organization_id
    ? ORGANIZATION_PLANS
    : SOLO_PLANS;
}

function canManageSubscription(user: AdminUser) {
  return user.can_manage_subscription !== false;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const [busy,    setBusy]    = useState<Record<string, boolean>>({});
  const [toast,   setToast]   = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== "1") {
      router.replace("/gs-admin");
    }
  }, [router]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/admin/users");
      if (!res.ok) throw new Error(`${res.status}`);
      setUsers(await res.json());
    } catch {
      setError("Failed to load users. Check backend connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function patch(userId: string, body: object, label: string) {
    setBusy(b => ({ ...b, [userId + label]: true }));
    try {
      const res = await adminFetch(`/admin/users/${userId}/subscription`, {
        method: "PATCH",
        body:   JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? res.status.toString());
      }
      showToast(`✓ ${label} applied`);
      await loadUsers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      showToast(`✗ ${msg}`);
    } finally {
      setBusy(b => ({ ...b, [userId + label]: false }));
    }
  }

  async function deleteUser(user: AdminUser) {
    const label = "Delete user";
    const name = user.full_name ? `${user.full_name} (${user.email})` : user.email;
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;

    setBusy(b => ({ ...b, [user.id + label]: true }));
    try {
      const res = await adminFetch(`/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? res.status.toString());
      }
      showToast("✓ User deleted");
      await loadUsers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      showToast(`✗ ${msg}`);
    } finally {
      setBusy(b => ({ ...b, [user.id + label]: false }));
    }
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    router.push("/gs-admin");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">Gulfstream Admin</h1>
            <p className="text-gray-400 text-xs">{users.length} users</p>
          </div>
        </div>
        <button onClick={logout} className="text-gray-400 hover:text-white text-sm transition-colors">
          Sign out
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search + Refresh */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by email or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={loadUsers}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No users found.</div>
        ) : (
          /* Desktop table */
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Trial / Period End</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-left px-4 py-3 min-w-[460px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map(user => (
                  <tr key={user.id} className="bg-gray-900/50 hover:bg-gray-900 transition-colors">
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-white truncate max-w-[200px]">{user.email}</div>
                      {user.full_name && (
                        <div className="text-gray-400 text-xs truncate">{user.full_name}</div>
                      )}
                      {user.subscription_scope === "organization" && (
                        <div className="text-blue-300 text-xs truncate">
                          Organization subscription · {user.organization_role === "owner" ? "Owner" : "Member"}
                        </div>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3"><PlanBadge plan={user.plan} /></td>

                    {/* Status */}
                    <td className="px-4 py-3"><StatusBadge status={user.status} /></td>

                    {/* Dates */}
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {user.trial_ends_at ? fmt(user.trial_ends_at) : fmt(user.current_period_end)}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-gray-400 text-xs">{fmt(user.created_at)}</td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Change plan */}
                        <select
                          defaultValue=""
                          disabled={!canManageSubscription(user)}
                          onChange={e => {
                            const val = e.target.value;
                            if (!val) return;
                            e.target.value = "";
                            patch(user.id, { plan: val }, `Plan → ${val}`);
                          }}
                          title={canManageSubscription(user) ? "Change plan" : "Use the organization owner row to update this subscription"}
                          className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {canManageSubscription(user) ? "Change plan…" : "Managed by owner"}
                          </option>
                          {plansForUser(user).map(p => (
                            <option key={p} value={p} disabled={p === user.plan}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </option>
                          ))}
                        </select>

                        {/* Extend trial 7 days */}
                        <button
                          onClick={() => patch(user.id, { extend_trial_days: 7 }, "+7 days")}
                          disabled={!canManageSubscription(user) || !!busy[user.id + "+7 days"]}
                          className="bg-blue-900 hover:bg-blue-800 disabled:opacity-50 border border-blue-700 text-blue-200 text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {busy[user.id + "+7 days"] ? "…" : "+7 days"}
                        </button>

                        {/* Extend trial 30 days */}
                        <button
                          onClick={() => patch(user.id, { extend_trial_days: 30 }, "+30 days")}
                          disabled={!canManageSubscription(user) || !!busy[user.id + "+30 days"]}
                          className="bg-blue-900 hover:bg-blue-800 disabled:opacity-50 border border-blue-700 text-blue-200 text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {busy[user.id + "+30 days"] ? "…" : "+30 days"}
                        </button>

                        {/* Full access (professional) */}
                        <button
                          onClick={() => patch(
                            user.id,
                            { plan: user.account_type === "organization_member" || user.organization_id ? "business" : "professional", status: "active" },
                            "Full access",
                          )}
                          disabled={!canManageSubscription(user) || !!busy[user.id + "Full access"]}
                          className="bg-purple-900 hover:bg-purple-800 disabled:opacity-50 border border-purple-700 text-purple-200 text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {busy[user.id + "Full access"] ? "…" : "Full access"}
                        </button>

                        {/* Delete user */}
                        <button
                          onClick={() => deleteUser(user)}
                          disabled={!!busy[user.id + "Delete user"]}
                          className="bg-red-950 hover:bg-red-900 disabled:opacity-50 border border-red-800 text-red-200 text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {busy[user.id + "Delete user"] ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
