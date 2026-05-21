"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { organizationApi } from "../../lib/api";
import { useChatStore } from "../../store/chatStore";
import { useRouter } from "next/navigation";
import type { Organization } from "../../types";

export function OrganizationView() {
  const router = useRouter();
  const user = useChatStore((s) => s.user);
  const setUser = useChatStore((s) => s.setUser);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    organizationApi.get()
      .then((data) => {
        setOrg(data);
        setName(data.name);
        setOrgEmail(data.org_email ?? "");
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setSaveMsg({ ok: false, text: "Organization name is required." });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await organizationApi.update({ name: name.trim(), org_email: orgEmail.trim() || undefined });
      setOrg(updated);
      setSaveMsg({ ok: true, text: "Organization updated successfully." });
    } catch (err) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!org || deleteConfirm !== org.name) {
      setDeleteError("Organization name does not match.");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await organizationApi.deleteOrg(deleteConfirm);
      // Refresh user and redirect
      if (user) setUser({ ...user, account_type: "solo", organization_id: null });
      router.push("/dashboard");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gs-muted" /></div>;
  }

  if (!org) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Organization details */}
      <section className="bg-gs-card rounded-xl border border-gs-border p-8 shadow-card">
        <h3 className="text-[18px] font-bold text-gs-text mb-6">Organization Settings</h3>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Organization Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-blue"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">
              Organization Email
              <span className="text-[10px] normal-case font-normal ml-1 text-gs-muted">(used for system notifications)</span>
            </label>
            <input
              type="email"
              value={orgEmail}
              onChange={(e) => setOrgEmail(e.target.value)}
              placeholder={user?.email ?? ""}
              className="w-full px-3 py-2.5 border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-blue"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Slug</label>
            <input
              type="text"
              value={org.slug}
              disabled
              className="w-full px-3 py-2.5 border border-gs-border rounded-button bg-gs-bg/50 text-gs-muted text-sm cursor-not-allowed"
            />
            <p className="text-xs text-gs-muted">Slug cannot be changed after creation.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gs-muted uppercase tracking-wider">Created</label>
            <p className="text-sm text-gs-text">{new Date(org.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>

          {saveMsg && <p className={`text-sm font-medium ${saveMsg.ok ? "text-gs-green" : "text-gs-red"}`}>{saveMsg.text}</p>}

          <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="bg-gs-card rounded-xl border border-gs-red/30 p-8 shadow-card">
        <h3 className="text-[18px] font-bold text-gs-red flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </h3>
        <p className="text-[13px] text-gs-muted mb-5">
          Permanently delete this organization. All members will be converted to solo accounts.
          Your data is preserved but the team structure will be removed.
        </p>
        <button
          onClick={() => { setShowDeleteModal(true); setDeleteConfirm(""); setDeleteError(""); }}
          className="border border-gs-red text-gs-red px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          Delete Organization
        </button>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-gs-card border border-gs-border rounded-2xl p-8 max-w-sm w-full shadow-card-hover space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gs-text">Delete Organization</h3>
            <p className="text-sm text-gs-muted">
              This action cannot be undone. Type <strong className="text-gs-text">{org.name}</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={org.name}
              className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-red"
            />
            {deleteError && <p className="text-sm text-gs-red">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 border border-gs-border rounded-button py-2.5 text-sm font-medium text-gs-text hover:bg-gs-bg">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading || deleteConfirm !== org.name}
                className="flex-1 bg-gs-red hover:bg-red-700 text-white rounded-button py-2.5 text-sm font-bold disabled:opacity-40"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
