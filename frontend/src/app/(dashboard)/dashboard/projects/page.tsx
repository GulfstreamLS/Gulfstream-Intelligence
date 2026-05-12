"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Download, Plus, Search, X, Check,
} from "lucide-react";
import { ProjectStatCards } from "../../../../components/projects/ProjectStatCards";
import { ProjectsTable } from "../../../../components/projects/ProjectsTable";
import { GlobalVisibilityBanner } from "../../../../components/projects/GlobalVisibilityBanner";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";
import { DynamicSelect } from "../../../../components/ui/DynamicSelect";
import { isPaymentRequiredError, organizationApi, projectApi, subscriptionApi } from "../../../../lib/api";
import { useChatStore } from "../../../../store/chatStore";
import type { Project, Subscription } from "../../../../types";

const PAGE_SIZE = 10;

const ALL_AUTHORITIES = ["FDA", "EMA", "Health Canada", "PMDA", "MHRA"];
const STATUSES = ["On Track", "At Risk", "Planning"];

// ── Shared form types ─────────────────────────────────────────────────────────

type ProjectFormState = {
  name: string; type: string; indication: string; therapeutic_area: string;
  dev_phase: string; status: Project["status"]; readiness_score: number;
  authorities: string[]; product_type: string;
};

const EMPTY_FORM: ProjectFormState = {
  name: "", type: "IND", indication: "", therapeutic_area: "",
  dev_phase: "", status: "Planning", readiness_score: 0,
  authorities: [], product_type: "",
};

const EXPIRED_SUBSCRIPTION_MESSAGE =
  "Your free trial has ended. Please upgrade your plan to create or edit projects.";

function BillingError({ message }: { message: string }) {
  const router = useRouter();

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold">{message}</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/subscription")}
          className="mt-1 text-xs font-bold underline hover:no-underline"
        >
          View subscription
        </button>
      </div>
    </div>
  );
}

function isSubscriptionExpired(subscription: Subscription | null) {
  if (!subscription) return false;
  if (subscription.status === "expired" || subscription.status === "cancelled") return true;
  return Boolean(
    subscription.status === "trialing" &&
    subscription.trial_ends_at &&
    new Date(subscription.trial_ends_at).getTime() <= Date.now()
  );
}

// ── Shared Form Fields ────────────────────────────────────────────────────────

function ProjectFormFields({
  form, setForm,
}: {
  form: ProjectFormState;
  setForm: React.Dispatch<React.SetStateAction<ProjectFormState>>;
}) {
  function toggleAuth(auth: string) {
    setForm(f => ({
      ...f,
      authorities: f.authorities.includes(auth)
        ? f.authorities.filter(a => a !== auth)
        : [...f.authorities, auth],
    }));
  }

  return (
    <>
      <div>
        <label className="block text-xs font-bold text-gs-muted uppercase tracking-wide mb-1">Project Name *</label>
        <input
          className="w-full h-10 px-3 bg-gs-card border border-gs-border rounded-lg text-sm text-gs-text focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gs-muted"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. AAV Gene Therapy Program"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gs-muted uppercase tracking-wide mb-1">Submission Type</label>
        <div className="flex gap-2 flex-wrap">
          {["IND", "BLA", "NDA", "ANDA"].map(t => (
            <label key={t} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${form.type === t ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600" : "border-gs-border text-gs-muted hover:border-gs-border"}`}>
              <input type="radio" className="hidden" value={t} checked={form.type === t} onChange={() => setForm(f => ({ ...f, type: t }))} />
              {t}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gs-muted uppercase tracking-wide mb-1">Product Type</label>
          <DynamicSelect
            category="product_type"
            value={form.product_type}
            onChange={v => setForm(f => ({ ...f, product_type: v }))}
            placeholder="Select product type…"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gs-muted uppercase tracking-wide mb-1">Development Phase</label>
          <DynamicSelect
            category="dev_phase"
            value={form.dev_phase}
            onChange={v => setForm(f => ({ ...f, dev_phase: v }))}
            placeholder="Select phase…"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gs-muted uppercase tracking-wide mb-1">Indication</label>
        <input
          className="w-full h-10 px-3 bg-gs-card border border-gs-border rounded-lg text-sm text-gs-text focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gs-muted"
          value={form.indication} onChange={e => setForm(f => ({ ...f, indication: e.target.value }))}
          placeholder="e.g. Duchenne Muscular Dystrophy"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gs-muted uppercase tracking-wide mb-1">Therapeutic Area</label>
        <DynamicSelect
          category="therapeutic_area"
          value={form.therapeutic_area}
          onChange={v => setForm(f => ({ ...f, therapeutic_area: v }))}
          placeholder="Select area…"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gs-muted uppercase tracking-wide mb-2">Target Authorities</label>
        <div className="flex flex-wrap gap-2">
          {ALL_AUTHORITIES.map(auth => (
            <button
              key={auth} type="button"
              onClick={() => toggleAuth(auth)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${form.authorities.includes(auth) ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600" : "border-gs-border text-gs-muted hover:border-gs-border"}`}
            >
              {form.authorities.includes(auth) && <Check size={12} />}
              {auth}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── New Project Modal ─────────────────────────────────────────────────────────

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<ProjectFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    try {
      await projectApi.create({ ...form, icon_type: null });
      onCreated();
      onClose();
    } catch (err) {
      setError(isPaymentRequiredError(err) ? EXPIRED_SUBSCRIPTION_MESSAGE : err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-gs-card rounded-2xl shadow-2xl dark:shadow-black/40 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gs-border">
          <h2 className="text-lg font-bold text-gs-text">New Project</h2>
          <button onClick={onClose} className="text-gs-muted hover:text-gs-muted"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <ProjectFormFields form={form} setForm={setForm} />
          {error && (error === EXPIRED_SUBSCRIPTION_MESSAGE ? <BillingError message={error} /> : <p className="text-red-500 text-sm">{error}</p>)}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gs-border rounded-sm text-sm font-bold text-gs-muted hover:bg-gs-bg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-blue-600 text-white rounded-sm text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Project Modal ────────────────────────────────────────────────────────

function EditProjectModal({ project, onClose, onSaved }: { project: Project; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ProjectFormState>({
    name: project.name,
    type: project.type,
    indication: project.indication ?? "",
    therapeutic_area: project.therapeutic_area ?? "",
    dev_phase: project.dev_phase ?? "Preclinical",
    status: project.status,
    readiness_score: project.readiness_score,
    authorities: project.authorities ?? [],
    product_type: project.product_type ?? "Small Molecule",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    try {
      await projectApi.update(project.id, {
        name: form.name,
        type: form.type,
        indication: form.indication || null,
        therapeutic_area: form.therapeutic_area || null,
        dev_phase: form.dev_phase || null,
        status: form.status,
        authorities: form.authorities.length > 0 ? form.authorities : null,
        product_type: form.product_type || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(isPaymentRequiredError(err) ? EXPIRED_SUBSCRIPTION_MESSAGE : err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-gs-card rounded-2xl shadow-2xl dark:shadow-black/40 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gs-border">
          <div>
            <h2 className="text-lg font-bold text-gs-text">Edit Project</h2>
            <p className="text-xs text-gs-muted mt-0.5">{project.name}</p>
          </div>
          <button onClick={onClose} className="text-gs-muted hover:text-gs-muted"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <ProjectFormFields form={form} setForm={setForm} />
          <div>
            <label className="block text-xs font-bold text-gs-muted uppercase tracking-wide mb-1">Status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <label key={s} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${form.status === s ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600" : "border-gs-border text-gs-muted hover:border-gs-border"}`}>
                  <input type="radio" className="hidden" value={s} checked={form.status === s} onChange={() => setForm(f => ({ ...f, status: s as Project["status"] }))} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          {error && (error === EXPIRED_SUBSCRIPTION_MESSAGE ? <BillingError message={error} /> : <p className="text-red-500 text-sm">{error}</p>)}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gs-border rounded-sm text-sm font-bold text-gs-muted hover:bg-gs-bg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-blue-600 text-white rounded-sm text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
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
      setError(isPaymentRequiredError(err) ? EXPIRED_SUBSCRIPTION_MESSAGE : err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-gs-card rounded-2xl shadow-2xl dark:shadow-black/40 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gs-border">
          <h2 className="text-lg font-bold text-gs-text">Import Projects</h2>
          <button onClick={onClose} className="text-gs-muted hover:text-gs-muted"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gs-muted">
            Upload an Excel file (.xlsx) to bulk import projects.{" "}
            <a href="/project-import-template.xlsx" download className="text-blue-600 hover:underline font-semibold">Download template</a>
          </p>
          <p className="text-xs text-gs-muted bg-gs-bg rounded-lg p-3 font-medium">
            Columns: Name, Type, Indication, Therapeutic Area, Dev Phase, Status, Authorities, Readiness Score, Product Type
          </p>
          <div className="border-2 border-dashed border-gs-border rounded-xl p-6 text-center">
            <input
              type="file" accept=".xlsx,.xls" id="excel-upload" className="hidden"
              onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(""); }}
            />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <p className="text-sm font-semibold text-blue-600">{file ? file.name : "Click to choose a file"}</p>
              <p className="text-xs text-gs-muted mt-1">XLSX or XLS, up to 10 MB</p>
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
          {error && (error === EXPIRED_SUBSCRIPTION_MESSAGE ? <BillingError message={error} /> : <p className="text-red-500 text-sm">{error}</p>)}
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2.5 border border-gs-border rounded-sm text-sm font-bold text-gs-muted hover:bg-gs-bg">
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
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isOrgOwner, setIsOrgOwner] = useState(false);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const user = useChatStore((s) => s.user);

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
  useEffect(() => { setPage(1); }, [search, statusFilter]);
  useEffect(() => {
    if (!user?.organization_id) {
      setIsOrgOwner(false);
      return;
    }
    organizationApi.get()
      .then(org => setIsOrgOwner(org.owner_id === user.id))
      .catch(() => setIsOrgOwner(false));
  }, [user?.id, user?.organization_id]);

  useEffect(() => {
    let isCurrent = true;
    subscriptionApi.get()
      .then(sub => {
        if (!isCurrent) return;
        setSubscriptionExpired(isSubscriptionExpired(sub));
      })
      .catch(() => null);

    return () => {
      isCurrent = false;
    };
  }, []);

  function requireActiveSubscription(action: () => void) {
    if (subscriptionExpired) return;
    action();
  }

  const stats = {
    total,
    onTrack: projects.filter(p => p.status === "On Track").length,
    atRisk: projects.filter(p => p.status === "At Risk").length,
    planning: projects.filter(p => p.status === "Planning").length,
  };

  return (
    <div className="min-h-screen bg-gs-bg p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gs-text tracking-tight">Projects</h1>
            <p className="text-gs-muted text-sm mt-1">Organize and manage your regulatory programs and projects in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => requireActiveSubscription(() => setModalOpen("import"))}
              disabled={subscriptionExpired}
              title={subscriptionExpired ? "Upgrade your plan to import projects" : undefined}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-sm text-sm font-bold bg-gs-card transition-all shadow-sm ${
                subscriptionExpired
                  ? "cursor-not-allowed border-gs-border text-gs-muted opacity-60"
                  : "border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              }`}
            >
              <Download size={18} /> Import Project
            </button>
            <button
              onClick={() => requireActiveSubscription(() => setModalOpen("new"))}
              disabled={subscriptionExpired}
              title={subscriptionExpired ? "Upgrade your plan to create projects" : undefined}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-sm text-sm font-bold transition-all ${
                subscriptionExpired
                  ? "cursor-not-allowed bg-gs-border text-gs-muted opacity-60"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        <ProjectStatCards {...stats} />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gs-muted" size={18} />
            <input
              type="text"
              placeholder="Search projects by name, indication, or therapeutic area..."
              className="w-full h-11 pl-10 pr-4 bg-gs-card border border-gs-border rounded-lg text-sm text-gs-text focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gs-muted"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="flex items-center h-11 px-4 bg-gs-card border border-gs-border rounded-lg text-sm font-semibold text-gs-text cursor-pointer focus:outline-none dark:[color-scheme:dark]"
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
          onStartChat={id => requireActiveSubscription(() => router.push(`/dashboard/chat?projectId=${id}`))}
          onViewDetail={id => router.push(`/dashboard/projects/${id}`)}
          onDelete={id => requireActiveSubscription(() => setDeleteId(id))}
          canDeleteProject={project => project.user_id === user?.id || isOrgOwner}
          actionsDisabled={subscriptionExpired}
          onEdit={id => {
            requireActiveSubscription(() => {
              const p = projects.find(pr => pr.id === id);
              if (p) setEditProject(p);
            });
          }}
        />
        <GlobalVisibilityBanner />
      </div>

      {modalOpen === "new" && (
        <NewProjectModal onClose={() => setModalOpen(null)} onCreated={loadProjects} />
      )}
      {modalOpen === "import" && (
        <ImportProjectModal onClose={() => setModalOpen(null)} onImported={loadProjects} />
      )}
      {editProject && (
        <EditProjectModal
          project={editProject}
          onClose={() => setEditProject(null)}
          onSaved={loadProjects}
        />
      )}
      {deleteId && (
        <ConfirmModal
          title="Delete Project"
          message="This will permanently delete the project and all associated chats. This action cannot be undone."
          confirmLabel="Delete Project"
          onCancel={() => setDeleteId(null)}
          onConfirm={async () => {
            try {
              await projectApi.remove(deleteId);
              loadProjects();
            } catch (err) {
              if (isPaymentRequiredError(err)) setDeleteId(null);
            }
            setDeleteId(null);
          }}
        />
      )}
    </div>
  );
}
