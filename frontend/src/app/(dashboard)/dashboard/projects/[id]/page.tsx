"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MessageSquare, Plus, ExternalLink, Trash2, Stethoscope, Pencil, Check, X,
} from "lucide-react";
import { projectApi, simulationApi } from "../../../../../lib/api";
import { ConfirmModal } from "../../../../../components/ui/ConfirmModal";
import { DynamicSelect } from "../../../../../components/ui/DynamicSelect";
import type { Conversation, Project, SimulationListItem } from "../../../../../types";

const AUTHORITY_FLAGS: Record<string, string> = {
  FDA: "🇺🇸", EMA: "🇪🇺", "Health Canada": "🇨🇦", PMDA: "🇯🇵", MHRA: "🇬🇧",
};

const ALL_AUTHORITIES = ["FDA", "EMA", "Health Canada", "PMDA", "MHRA"];
const STATUSES = ["On Track", "At Risk", "Planning"];
function EditProjectModal({ project, onClose, onSaved }: { project: import("../../../../../types").Project; onClose: () => void; onSaved: (p: import("../../../../../types").Project) => void }) {
  const [form, setForm] = useState({
    name: project.name,
    type: project.type,
    indication: project.indication ?? "",
    therapeutic_area: project.therapeutic_area ?? "",
    dev_phase: project.dev_phase ?? "Preclinical",
    status: project.status as import("../../../../../types").Project["status"],
    authorities: project.authorities ?? [] as string[],
    product_type: project.product_type ?? "Small Molecule",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleAuth(auth: string) {
    setForm(f => ({
      ...f,
      authorities: f.authorities.includes(auth) ? f.authorities.filter(a => a !== auth) : [...f.authorities, auth],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    try {
      const updated = await projectApi.update(project.id, {
        name: form.name, type: form.type,
        indication: form.indication || null,
        therapeutic_area: form.therapeutic_area || null,
        dev_phase: form.dev_phase || null,
        status: form.status,
        authorities: form.authorities.length > 0 ? form.authorities : null,
        product_type: form.product_type || null,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Project</h2>
            <p className="text-xs text-slate-400 mt-0.5">{project.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Project Name *</label>
            <input className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Submission Type</label>
            <div className="flex gap-2 flex-wrap">
              {["IND", "BLA", "NDA", "ANDA"].map(t => (
                <label key={t} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${form.type === t ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600"}`}>
                  <input type="radio" className="hidden" value={t} checked={form.type === t} onChange={() => setForm(f => ({ ...f, type: t }))} />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Product Type</label>
              <DynamicSelect
                category="product_type"
                value={form.product_type}
                onChange={v => setForm(f => ({ ...f, product_type: v }))}
                placeholder="Select product type…"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Dev Phase</label>
              <DynamicSelect
                category="dev_phase"
                value={form.dev_phase}
                onChange={v => setForm(f => ({ ...f, dev_phase: v }))}
                placeholder="Select phase…"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Indication</label>
            <input className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={form.indication} onChange={e => setForm(f => ({ ...f, indication: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Therapeutic Area</label>
            <DynamicSelect
              category="therapeutic_area"
              value={form.therapeutic_area}
              onChange={v => setForm(f => ({ ...f, therapeutic_area: v }))}
              placeholder="Select area…"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <label key={s} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${form.status === s ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600"}`}>
                  <input type="radio" className="hidden" value={s} checked={form.status === s} onChange={() => setForm(f => ({ ...f, status: s as typeof form.status }))} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Target Authorities</label>
            <div className="flex flex-wrap gap-2">
              {ALL_AUTHORITIES.map(auth => (
                <button key={auth} type="button" onClick={() => toggleAuth(auth)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${form.authorities.includes(auth) ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600"}`}>
                  {form.authorities.includes(auth) && <Check size={12} />}
                  {auth}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-200 rounded-sm text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-blue-600 text-white rounded-sm text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Project["status"] }) {
  const styles =
    status === "On Track" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
    status === "At Risk"  ? "bg-orange-50 text-orange-600 border-orange-100" :
                            "bg-purple-50 text-purple-600 border-purple-100";
  const dot =
    status === "On Track" ? "bg-emerald-500" :
    status === "At Risk"  ? "bg-orange-500"  : "bg-purple-500";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${styles}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [simulations, setSimulations] = useState<SimulationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      projectApi.get(id),
      projectApi.getConversations(id),
      simulationApi.listSessions(id),
    ])
      .then(([p, convos, sims]) => { setProject(p); setConversations(convos); setSimulations(sims); })
      .catch(() => router.push("/dashboard/projects"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) return null;

  const authorities = project.authorities ?? [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <button
          onClick={() => router.push("/dashboard/projects")}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Projects
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                <span className="text-[11px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded uppercase">{project.type}</span>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 mt-3">
                {project.indication && (
                  <div><span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Indication</span><p className="font-semibold text-slate-700 mt-0.5">{project.indication}</p></div>
                )}
                {project.dev_phase && (
                  <div><span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Dev Phase</span><p className="font-semibold text-slate-700 mt-0.5">{project.dev_phase}</p></div>
                )}
                {project.therapeutic_area && (
                  <div><span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Therapeutic Area</span><p className="font-semibold text-slate-700 mt-0.5">{project.therapeutic_area}</p></div>
                )}
              </div>
              {authorities.length > 0 && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Target Authorities</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {authorities.map((auth, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs font-semibold border border-slate-200 rounded-full px-2.5 py-1 text-slate-600">
                        {AUTHORITY_FLAGS[auth] ?? ""} {auth}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Pencil size={13} /> Edit Project
              </button>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Overall Readiness</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{project.readiness_score}%</p>
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${project.readiness_score > 70 ? "bg-emerald-500" : project.readiness_score > 40 ? "bg-orange-400" : "bg-red-500"}`}
                    style={{ width: `${project.readiness_score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conversations */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-700">Regulatory Chats ({conversations.length})</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-sm text-xs font-bold hover:bg-red-50 transition-all"
              >
                <Trash2 size={14} /> Delete
              </button>
              <button
                onClick={() => router.push(`/dashboard/chat?projectId=${id}`)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-sm text-xs font-bold hover:bg-blue-700 transition-all"
              >
                <Plus size={14} /> Start New Chat
              </button>
            </div>
          </div>
          {conversations.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <MessageSquare size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400 font-medium">No chats yet for this project.</p>
              <button
                onClick={() => router.push(`/dashboard/chat?projectId=${id}`)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-sm text-sm font-bold hover:bg-blue-700"
              >
                <Plus size={16} /> Start First Chat
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {conversations.map(convo => {
                const date = new Date(convo.updated_at);
                return (
                  <li
                    key={convo.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer group"
                    onClick={() => router.push(`/dashboard/chat?conversation=${convo.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{convo.title ?? "Untitled Chat"}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Simulations */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mt-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-700">HA Simulations ({simulations.length})</h2>
            {conversations.length > 0 && (
              <button
                onClick={() => router.push(`/dashboard/ha-simulation?projectId=${id}`)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-sm text-xs font-bold hover:bg-indigo-700 transition-all"
              >
                <Stethoscope size={14} /> Run Simulation
              </button>
            )}
          </div>
          {simulations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Stethoscope size={28} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400 font-medium">No simulations run for this project yet.</p>
              {conversations.length > 0 && (
                <button
                  onClick={() => router.push(`/dashboard/ha-simulation?projectId=${id}`)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-sm text-sm font-bold hover:bg-indigo-700"
                >
                  <Plus size={16} /> Run First Simulation
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {simulations.map(sim => (
                <li
                  key={sim.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer group"
                  onClick={() => router.push(`/dashboard/ha-simulation?sessionId=${sim.id}&projectId=${id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Stethoscope size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{sim.authority} · {sim.focus_area}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {sim.submission_type} · {sim.stage} · {sim.total_questions} questions · {Math.round(sim.readiness_score)}% readiness · {new Date(sim.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      sim.readiness_score >= 70 ? "bg-emerald-50 text-emerald-600" :
                      sim.readiness_score >= 40 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"
                    }`}>
                      {sim.confidence_level}
                    </span>
                    <ExternalLink size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Project"
          message="This will permanently delete the project and all associated chats. This action cannot be undone."
          confirmLabel="Delete Project"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            try { await projectApi.remove(id); router.push("/dashboard/projects"); } catch { setConfirmDelete(false); }
          }}
        />
      )}
      {editOpen && project && (
        <EditProjectModal
          project={project}
          onClose={() => setEditOpen(false)}
          onSaved={updated => setProject(updated)}
        />
      )}
    </div>
  );
}
