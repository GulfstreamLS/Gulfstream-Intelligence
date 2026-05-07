"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Download, Plus, Search, X, Check,
} from "lucide-react";
import { ProjectStatCards } from "../../../../components/projects/ProjectStatCards";
import { ProjectsTable } from "../../../../components/projects/ProjectsTable";
import { GlobalVisibilityBanner } from "../../../../components/projects/GlobalVisibilityBanner";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";
import { projectApi } from "../../../../lib/api";
import type { Project } from "../../../../types";

const PAGE_SIZE = 10;

const THERAPEUTIC_AREAS = [
  "Rare Disease", "Oncology", "Infectious Disease", "Metabolic",
  "Neurology", "Cardiology", "Immunology", "Ophthalmology",
];
const PHASES = ["Preclinical", "Phase 1", "Phase 2", "Phase 3", "BLA/MAA"];
const ALL_AUTHORITIES = ["FDA", "EMA", "Health Canada", "PMDA", "MHRA"];
const STATUSES = ["On Track", "At Risk", "Planning"];

// ── New Project Modal ─────────────────────────────────────────────────────────

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", type: "IND", indication: "", therapeutic_area: "",
    dev_phase: "Preclinical", status: "Planning" as Project["status"],
    readiness_score: 0, authorities: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleAuth(auth: string) {
    setForm(f => ({
      ...f,
      authorities: f.authorities.includes(auth)
        ? f.authorities.filter(a => a !== auth)
        : [...f.authorities, auth],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    try {
      await projectApi.create({ ...form, icon_type: null, metadata_: null } as Parameters<typeof projectApi.create>[0]);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">New Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Project Name *</label>
            <input
              className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. AAV Gene Therapy Program"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Submission Type</label>
            <div className="flex gap-3">
              {["IND", "BLA", "NDA", "ANDA"].map(t => (
                <label key={t} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${form.type === t ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  <input type="radio" className="hidden" value={t} checked={form.type === t} onChange={() => setForm(f => ({ ...f, type: t }))} />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Indication</label>
            <input
              className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={form.indication} onChange={e => setForm(f => ({ ...f, indication: e.target.value }))}
              placeholder="e.g. Duchenne Muscular Dystrophy"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Therapeutic Area</label>
              <select
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                value={form.therapeutic_area} onChange={e => setForm(f => ({ ...f, therapeutic_area: e.target.value }))}
              >
                <option value="">Select…</option>
                {THERAPEUTIC_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Development Phase</label>
              <select
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                value={form.dev_phase} onChange={e => setForm(f => ({ ...f, dev_phase: e.target.value }))}
              >
                {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Target Authorities</label>
            <div className="flex flex-wrap gap-2">
              {ALL_AUTHORITIES.map(auth => (
                <button
                  key={auth} type="button"
                  onClick={() => toggleAuth(auth)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${form.authorities.includes(auth) ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                >
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
              {saving ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Import Project Modal ──────────────────────────────────────────────────────

function ImportProjectModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const res = await projectApi.importExcel(file);
      setResult(res);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Import Projects</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-500">
            Upload an Excel file (.xlsx) to bulk import projects.{" "}
            <a href="/project-import-template.xlsx" download className="text-blue-600 hover:underline font-semibold">Download template</a>
          </p>
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
            <input
              type="file" accept=".xlsx,.xls" id="excel-upload" className="hidden"
              onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(""); }}
            />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <p className="text-sm font-semibold text-blue-600">{file ? file.name : "Click to choose a file"}</p>
              <p className="text-xs text-slate-400 mt-1">XLSX or XLS, up to 10 MB</p>
            </label>
          </div>
          {result && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 text-sm text-emerald-700">
              ✓ {result.created} project{result.created !== 1 ? "s" : ""} imported successfully.
              {result.errors.length > 0 && (
                <ul className="mt-1 text-xs text-red-500 list-disc ml-4">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2.5 border border-slate-200 rounded-sm text-sm font-bold text-slate-600 hover:bg-slate-50">
              {result ? "Close" : "Cancel"}
            </button>
            {!result && (
              <button onClick={handleImport} disabled={!file || loading} className="px-4 py-2.5 bg-blue-600 text-white rounded-sm text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
                {loading ? "Importing…" : "Import"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState<"new" | "import" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectApi.list({ page, page_size: PAGE_SIZE, search: search || undefined, status_filter: statusFilter || undefined });
      setProjects(res.items);
      setTotal(res.total);
    } catch {
      // silently fail — table shows empty state
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Debounce search
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const stats = {
    total,
    onTrack: projects.filter(p => p.status === "On Track").length,
    atRisk: projects.filter(p => p.status === "At Risk").length,
    planning: projects.filter(p => p.status === "Planning").length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Projects</h1>
            <p className="text-slate-500 text-sm mt-1">Organize and manage your regulatory programs and projects in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen("import")}
              className="flex items-center gap-2 px-4 py-2.5 border border-blue-600 text-blue-600 rounded-sm text-sm font-bold bg-white hover:bg-blue-50 transition-all shadow-sm"
            >
              <Download size={18} /> Import Project
            </button>
            <button
              onClick={() => setModalOpen("new")}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-sm text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        <ProjectStatCards {...stats} />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search projects by name, indication, or therapeutic area..."
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="flex items-center h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 cursor-pointer focus:outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <ProjectsTable
          projects={projects}
          loading={loading}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onStartChat={id => router.push(`/dashboard/chat?projectId=${id}`)}
          onViewDetail={id => router.push(`/dashboard/projects/${id}`)}
          onDelete={id => setDeleteId(id)}
        />
        <GlobalVisibilityBanner />
      </div>

      {modalOpen === "new" && (
        <NewProjectModal onClose={() => setModalOpen(null)} onCreated={loadProjects} />
      )}
      {modalOpen === "import" && (
        <ImportProjectModal onClose={() => setModalOpen(null)} onImported={loadProjects} />
      )}
      {deleteId && (
        <ConfirmModal
          title="Delete Project"
          message="This will permanently delete the project and all associated chats. This action cannot be undone."
          confirmLabel="Delete Project"
          onCancel={() => setDeleteId(null)}
          onConfirm={async () => {
            try { await projectApi.remove(deleteId); loadProjects(); } catch { /* silently fail */ }
            setDeleteId(null);
          }}
        />
      )}
    </div>
  );
}
