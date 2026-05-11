"use client";

import { useState, useEffect } from "react";
import { UserPlus, Trash2, Crown, Loader2, X } from "lucide-react";
import { organizationApi } from "../../lib/api";
import { useChatStore } from "../../store/chatStore";
import type { OrgMember } from "../../types";

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
      role === "owner" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-gs-bg text-gs-muted border border-gs-border"
    }`}>
      {role}
    </span>
  );
}

export function TeamView() {
  const user = useChatStore((s) => s.user);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmOwner, setConfirmOwner] = useState<OrgMember | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<OrgMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadMembers() {
    try {
      const data = await organizationApi.listMembers();
      setMembers(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadMembers(); }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      await organizationApi.inviteMember(inviteEmail.trim(), inviteName.trim() || undefined);
      setInviteSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteName("");
      setTimeout(() => { setInviteSuccess(""); setShowInviteModal(false); }, 2000);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleMakeOwner() {
    if (!confirmOwner) return;
    setActionLoading(true);
    try {
      await organizationApi.updateMemberRole(confirmOwner.user_id, "owner");
      await loadMembers();
      setConfirmOwner(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemove() {
    if (!confirmRemove) return;
    setActionLoading(true);
    try {
      await organizationApi.removeMember(confirmRemove.user_id);
      await loadMembers();
      setConfirmRemove(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gs-card rounded-xl border border-gs-border shadow-card overflow-hidden">
        <div className="p-8 border-b border-gs-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-[18px] font-bold text-gs-text mb-1">Team Members</h3>
            <p className="text-[13px] text-gs-muted">Manage your organization&apos;s team access and roles.</p>
          </div>
          <button
            onClick={() => { setShowInviteModal(true); setInviteError(""); setInviteSuccess(""); }}
            className="btn-primary px-5 py-2.5 flex items-center gap-2 shrink-0"
          >
            <UserPlus className="w-[18px] h-[18px]" /> Invite Member
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gs-muted" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[560px]">
              <thead className="bg-gs-bg text-[11px] font-bold text-gs-muted uppercase tracking-widest border-b border-gs-border">
                <tr>
                  <th className="px-8 py-4">Name &amp; Email</th>
                  <th className="px-8 py-4">Role</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gs-border">
                {members.map((m) => {
                  const isMe = m.user_id === user?.id;
                  return (
                    <tr key={m.id} className="hover:bg-gs-bg transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gs-bg rounded-full flex items-center justify-center font-bold text-[12px] text-gs-muted border border-gs-border">
                            {(m.full_name ?? m.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gs-text">
                              {m.full_name ?? m.email}
                              {isMe && <span className="text-[10px] font-black bg-blue-50 text-gs-blue px-1.5 py-0.5 rounded ml-1 uppercase">Me</span>}
                            </p>
                            {m.full_name && <p className="text-[12px] text-gs-muted font-medium">{m.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5"><RoleBadge role={m.role} /></td>
                      <td className="px-8 py-5">
                        <span className={`flex items-center gap-1.5 text-[12px] font-bold ${m.status === "active" ? "text-gs-green" : "text-gs-muted"}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${m.status === "active" ? "bg-gs-green" : "bg-gs-muted"}`} />
                          {m.status === "active" ? "Active" : "Invited"}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {!isMe && (
                          <div className="flex justify-end gap-3">
                            {m.role !== "owner" && (
                              <button
                                onClick={() => setConfirmOwner(m)}
                                title="Make Owner"
                                className="text-gs-muted hover:text-amber-500 transition-colors"
                              >
                                <Crown className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setConfirmRemove(m)}
                              title="Remove Member"
                              className="text-gs-muted hover:text-gs-red transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-gs-card border border-gs-border rounded-2xl p-8 max-w-sm w-full shadow-card-hover" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gs-text">Invite Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gs-muted hover:text-gs-text"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gs-text">Full name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-blue"
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gs-text">Email address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] border border-gs-border rounded-button bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-gs-blue"
                  placeholder="colleague@company.com"
                />
              </div>
              {inviteError && <p className="text-sm text-gs-red">{inviteError}</p>}
              {inviteSuccess && <p className="text-sm text-gs-green">{inviteSuccess}</p>}
              <button type="submit" disabled={inviteLoading} className="btn-primary w-full min-h-[44px] disabled:opacity-50">
                {inviteLoading ? "Sending…" : "Send Invite"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Make owner confirmation */}
      {confirmOwner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4" onClick={() => setConfirmOwner(null)}>
          <div className="bg-gs-card border border-gs-border rounded-2xl p-8 max-w-sm w-full shadow-card-hover space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gs-text">Transfer Ownership</h3>
            <p className="text-sm text-gs-muted">
              You are about to make <strong className="text-gs-text">{confirmOwner.full_name ?? confirmOwner.email}</strong> the owner of this organization.
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              You will become a regular member. This cannot be undone without the new owner&apos;s action.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmOwner(null)} className="flex-1 border border-gs-border rounded-button py-2.5 text-sm font-medium text-gs-text hover:bg-gs-bg">Cancel</button>
              <button onClick={handleMakeOwner} disabled={actionLoading} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-button py-2.5 text-sm font-bold disabled:opacity-50">
                {actionLoading ? "Updating…" : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirmation */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4" onClick={() => setConfirmRemove(null)}>
          <div className="bg-gs-card border border-gs-border rounded-2xl p-8 max-w-sm w-full shadow-card-hover space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gs-text">Remove Member</h3>
            <p className="text-sm text-gs-muted">
              Are you sure you want to remove <strong className="text-gs-text">{confirmRemove.full_name ?? confirmRemove.email}</strong> from the organization?
              Their account will remain but they will lose access to shared data.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setConfirmRemove(null)} className="flex-1 border border-gs-border rounded-button py-2.5 text-sm font-medium text-gs-text hover:bg-gs-bg">Cancel</button>
              <button onClick={handleRemove} disabled={actionLoading} className="flex-1 bg-gs-red hover:bg-red-700 text-white rounded-button py-2.5 text-sm font-bold disabled:opacity-50">
                {actionLoading ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
