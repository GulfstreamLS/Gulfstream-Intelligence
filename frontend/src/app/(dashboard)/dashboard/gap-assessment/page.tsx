"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type React from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Clock, FileText, Folder, Info, PenLine, ShieldCheck, Trash2, UploadCloud, X } from "lucide-react";
import { GapPageHeader }        from "../../../../components/gap-assessment/GapPageHeader";
import { RegionSelectionPanel } from "../../../../components/gap-assessment/RegionSelectionPanel";
import { GapStatCards }         from "../../../../components/gap-assessment/GapStatCards";
import { ReadinessByDomain }    from "../../../../components/gap-assessment/ReadinessByDomain";
import { GapSeverityDonut }     from "../../../../components/gap-assessment/GapSeverityDonut";
import { GapNextSteps }         from "../../../../components/gap-assessment/GapNextSteps";
import { GapTableSection }      from "../../../../components/gap-assessment/GapTableSection";
import { AssessmentBasisPanel, type AssessmentBasis } from "../../../../components/gap-assessment/AssessmentBasisPanel";
import { assessmentApi, projectApi } from "../../../../lib/api";
import { useSubscription }      from "../../../../hooks/useSubscription";
import { UpgradeGate }          from "../../../../components/ui/UpgradeGate";
import type { AssessmentDocumentSummary, GapAssessmentResponse, GapAssessmentRun, Project } from "../../../../types";

const ASSESSMENT_TYPES = [
  "IND / CTA Readiness",
  "Global Development Readiness",
  "Health Authority Meeting Readiness",
  "NDA / BLA / MAA Readiness",
  "CMC Readiness",
  "Nonclinical Readiness",
  "Clinical Readiness",
];

type SourceType = "project" | "upload" | "paste" | "general" | "chat";
type SaveMode = "none" | "new" | "existing";

const EMPTY_PROJECT = {
  name: "",
  type: "IND",
  indication: "",
  therapeutic_area: "",
  dev_phase: "",
  product_type: "",
};

type SetupRunSettings = {
  source: SourceType;
  projectId?: string;
  projectName?: string;
  files: File[];
  programDetails: string;
  saveMode: SaveMode;
  newProject: typeof EMPTY_PROJECT;
  authority?: string;
  assessmentType: string;
};

const SOURCE_OPTIONS: Array<{ key: SourceType; title: string; description: string; icon: React.ReactNode; button: string }> = [
  { key: "project", title: "Use Existing Project", description: "Use project profile, saved documents, prior chat outputs, Document Intelligence findings, HA simulation outputs, and prior assessments.", icon: <Folder size={18} />, button: "Select Project" },
  { key: "upload", title: "Upload Documents", description: "Run a one-time assessment from protocol, IB, CMC, nonclinical, clinical, briefing, or strategy documents.", icon: <UploadCloud size={18} />, button: "Upload Files" },
  { key: "paste", title: "Paste Program Details", description: "Enter product, modality, indication, phase, target region, objective, and known concerns without uploading documents.", icon: <PenLine size={18} />, button: "Enter Details" },
  { key: "general", title: "General Assessment", description: "Lower confidence. Uses only information provided in this session and will not use project documents unless attached to a project.", icon: <Info size={18} />, button: "Start General Assessment" },
  { key: "chat", title: "Use Existing Analyzed Documents", description: "Use AI gap analysis already generated from documents uploaded in Regulatory Chat.", icon: <FileText size={18} />, button: "Use Chat Analysis" },
];

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function sourceLabel(source: SourceType) {
  if (source === "project") return "Project-Based";
  if (source === "upload") return "Uploaded Documents";
  if (source === "paste") return "Pasted Program Details";
  if (source === "general") return "General Exploratory";
  return "Chat Analysis";
}

function defaultSaveMode(source: SourceType): SaveMode {
  if (source === "paste" || source === "general" || source === "chat") return "none";
  return "existing";
}

function SetupModal({
  open,
  projects,
  initialProjectId,
  onClose,
  onRun,
  running,
}: {
  open: boolean;
  projects: Project[];
  initialProjectId?: string;
  onClose: () => void;
  onRun: (settings: SetupRunSettings) => void;
  running: boolean;
}) {
  const [source, setSource] = useState<SourceType>("project");
  const [projectId, setProjectId] = useState(initialProjectId ?? "");
  const [saveMode, setSaveMode] = useState<SaveMode>("existing");
  const [files, setFiles] = useState<File[]>([]);
  const [programDetails, setProgramDetails] = useState("");
  const [authority, setAuthority] = useState<string | undefined>(undefined);
  const [assessmentType, setAssessmentType] = useState(ASSESSMENT_TYPES[0]);
  const [newProject, setNewProject] = useState(EMPTY_PROJECT);

  useEffect(() => {
    if (open && initialProjectId) {
      setSource("project");
      setProjectId(initialProjectId);
    }
  }, [initialProjectId, open]);

  if (!open) return null;

  const selectedProject = projects.find(project => project.id === projectId);
  const canRun =
    assessmentType &&
    (source !== "project" || projectId) &&
    (source !== "upload" || files.length > 0) &&
    (source !== "upload" || saveMode !== "existing" || projectId) &&
    (source !== "upload" || saveMode !== "new" || newProject.name.trim()) &&
    ((source !== "paste" && source !== "general") || programDetails.trim().length >= 20) &&
    ((source !== "paste" && source !== "general") || saveMode !== "existing" || projectId) &&
    ((source !== "paste" && source !== "general") || saveMode !== "new" || newProject.name.trim());

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gs-card border border-gs-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gs-border">
          <div>
            <h2 className="text-lg font-bold text-gs-text">New Global Gap Assessment</h2>
            <p className="text-xs font-semibold text-gs-muted mt-1">Define what is being assessed, the source material, region, and readiness type before running.</p>
          </div>
          <button onClick={onClose} className="text-gs-muted hover:text-gs-text"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-[12px] font-black uppercase tracking-[0.14em] text-gs-muted mb-3">1. Select assessment source</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              {SOURCE_OPTIONS.map(option => (
                <button
                  key={option.key}
                  onClick={() => {
                    setSource(option.key);
                    setSaveMode(defaultSaveMode(option.key));
                  }}
                  className={`text-left p-4 rounded-xl border transition-all ${source === option.key ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40" : "border-gs-border bg-gs-bg hover:border-blue-300"}`}
                >
                  <div className="flex items-center gap-2 text-blue-600 mb-3">{option.icon}<span className="text-xs font-black">{option.button}</span></div>
                  <p className="text-sm font-black text-gs-text mb-2">{option.title}</p>
                  <p className="text-[11px] font-semibold text-gs-muted leading-relaxed">{option.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[12px] font-black uppercase tracking-[0.14em] text-gs-muted mb-3">2. Define source details</h3>
            {source === "project" && (
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full h-11 px-3 bg-gs-card border border-gs-border rounded-lg text-sm font-semibold text-gs-text">
                <option value="">Select project...</option>
                {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            )}

            {source === "upload" && (
              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={e => setFiles(Array.from(e.target.files ?? []))}
                  className="block w-full text-sm text-gs-muted file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["existing", "new", "none"] as SaveMode[]).map(mode => (
                    <button key={mode} onClick={() => setSaveMode(mode)} className={`p-3 rounded-lg border text-left ${saveMode === mode ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gs-border text-gs-muted"}`}>
                      <p className="text-sm font-black">{mode === "existing" ? "Attach to Existing Project" : mode === "new" ? "Save as New Project" : "Session Only"}</p>
                    </button>
                  ))}
                </div>
                {saveMode === "existing" && (
                  <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full h-11 px-3 bg-gs-card border border-gs-border rounded-lg text-sm font-semibold text-gs-text">
                    <option value="">Select project...</option>
                    {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                )}
                {saveMode === "new" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} placeholder="Project name" className="h-11 px-3 bg-gs-card border border-gs-border rounded-lg text-sm" />
                    <input value={newProject.product_type} onChange={e => setNewProject(p => ({ ...p, product_type: e.target.value }))} placeholder="Product / modality" className="h-11 px-3 bg-gs-card border border-gs-border rounded-lg text-sm" />
                    <input value={newProject.indication} onChange={e => setNewProject(p => ({ ...p, indication: e.target.value }))} placeholder="Indication" className="h-11 px-3 bg-gs-card border border-gs-border rounded-lg text-sm" />
                    <input value={newProject.dev_phase} onChange={e => setNewProject(p => ({ ...p, dev_phase: e.target.value }))} placeholder="Development phase" className="h-11 px-3 bg-gs-card border border-gs-border rounded-lg text-sm" />
                  </div>
                )}
              </div>
            )}

            {(source === "paste" || source === "general") && (
              <div className="space-y-4">
                <textarea
                  value={programDetails}
                  onChange={e => setProgramDetails(e.target.value)}
                  className="w-full min-h-[160px] p-3 bg-gs-card border border-gs-border rounded-lg text-sm text-gs-text"
                  placeholder="Product name, modality, indication, development phase, target region, regulatory objective, clinical summary, nonclinical summary, CMC summary, known concerns or questions."
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["none", "existing", "new"] as SaveMode[]).map(mode => (
                    <button key={mode} onClick={() => setSaveMode(mode)} className={`p-3 rounded-lg border text-left ${saveMode === mode ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gs-border text-gs-muted"}`}>
                      <p className="text-sm font-black">{mode === "existing" ? "Attach to Existing Project" : mode === "new" ? "Save as New Project" : "Session Only"}</p>
                    </button>
                  ))}
                </div>
                {saveMode === "existing" && (
                  <select value={projectId} onChange={e => setProjectId(e.target.value)} className="w-full h-11 px-3 bg-gs-card border border-gs-border rounded-lg text-sm font-semibold text-gs-text">
                    <option value="">Select project...</option>
                    {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                )}
                {saveMode === "new" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} placeholder="Project name" className="h-11 px-3 bg-gs-card border border-gs-border rounded-lg text-sm" />
                    <input value={newProject.product_type} onChange={e => setNewProject(p => ({ ...p, product_type: e.target.value }))} placeholder="Product / modality" className="h-11 px-3 bg-gs-card border border-gs-border rounded-lg text-sm" />
                    <input value={newProject.indication} onChange={e => setNewProject(p => ({ ...p, indication: e.target.value }))} placeholder="Indication" className="h-11 px-3 bg-gs-card border border-gs-border rounded-lg text-sm" />
                    <input value={newProject.dev_phase} onChange={e => setNewProject(p => ({ ...p, dev_phase: e.target.value }))} placeholder="Development phase" className="h-11 px-3 bg-gs-card border border-gs-border rounded-lg text-sm" />
                  </div>
                )}
              </div>
            )}

            {source === "chat" && (
              <div className="rounded-xl border border-gs-border bg-gs-bg p-4">
                <p className="text-sm font-bold text-gs-text">The assessment will use existing AI-generated gaps and actions from analyzed Regulatory Chat documents.</p>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-[12px] font-black uppercase tracking-[0.14em] text-gs-muted mb-3">3. Select region or health authority</h3>
            <RegionSelectionPanel onAuthorityChange={setAuthority} selectedAuthority={authority} />
          </section>

          <section>
            <h3 className="text-[12px] font-black uppercase tracking-[0.14em] text-gs-muted mb-3">4. Select assessment type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ASSESSMENT_TYPES.map(type => (
                <button key={type} onClick={() => setAssessmentType(type)} className={`px-4 py-3 rounded-lg border text-sm font-bold text-left ${assessmentType === type ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gs-border text-gs-muted hover:border-blue-300"}`}>
                  {type}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between px-6 py-5 border-t border-gs-border bg-gs-bg">
          <p className="text-xs font-semibold text-gs-muted">
            {selectedProject ? `Project: ${selectedProject.name}` : "Project-based runs save assessment history to the selected project."}
          </p>
          <button
            disabled={!canRun || running}
            onClick={() => onRun({ source, projectId, projectName: selectedProject?.name, files, programDetails, saveMode, newProject, authority, assessmentType })}
            className="h-10 px-5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? "Running..." : "Run Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectAssessmentPanel({
  projects,
  selectedProjectId,
  runs,
  loading,
  onSelectProject,
  onSelectRun,
  onDeleteRun,
}: {
  projects: Project[];
  selectedProjectId?: string;
  runs: GapAssessmentRun[];
  loading: boolean;
  onSelectProject: (project: Project) => void;
  onSelectRun: (run: GapAssessmentRun) => void;
  onDeleteRun: (run: GapAssessmentRun) => void;
}) {
  const selectedProject = projects.find(project => project.id === selectedProjectId);

  return (
    <aside className="lg:col-span-2 space-y-6 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <div className="bg-gs-card border border-gs-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gs-border">
          <h2 className="text-[12px] font-black uppercase tracking-[0.14em] text-gs-text">Projects</h2>
          <p className="text-[11px] font-semibold text-gs-muted mt-1">Select a project to view its latest assessment.</p>
        </div>
        <div className="max-h-[300px] overflow-y-auto divide-y divide-gs-border">
          {projects.length === 0 ? (
            <p className="px-5 py-5 text-xs font-semibold text-gs-muted">No projects available.</p>
          ) : projects.map(project => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project)}
              className={`w-full text-left px-5 py-4 hover:bg-gs-bg transition-colors ${selectedProjectId === project.id ? "bg-blue-50 dark:bg-blue-950/40" : ""}`}
            >
              <p className="text-sm font-bold text-gs-text truncate">{project.name}</p>
              <p className="text-[11px] font-semibold text-gs-muted mt-1 truncate">
                {project.product_type || project.type} · {project.dev_phase || "Phase not set"} · {project.readiness_score}% readiness
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gs-card border border-gs-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gs-border">
          <h2 className="text-[12px] font-black uppercase tracking-[0.14em] text-gs-text">Assessment History</h2>
          <p className="text-[11px] font-semibold text-gs-muted mt-1">{selectedProject ? selectedProject.name : "Select a project"}</p>
        </div>
        <div className="divide-y divide-gs-border">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gs-border/60 animate-pulse" />)
          ) : !selectedProject ? (
            <p className="px-5 py-5 text-xs font-semibold text-gs-muted">Project history appears here.</p>
          ) : runs.length === 0 ? (
            <p className="px-5 py-5 text-xs font-semibold text-gs-muted">No saved assessments for this project yet.</p>
          ) : runs.map((run, index) => (
            <div key={run.id} className="px-5 py-4">
              <button onClick={() => onSelectRun(run)} className="w-full text-left group">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-blue-600 shrink-0" />
                  <p className="text-xs font-black text-gs-text group-hover:text-blue-600 truncate">
                    {index === 0 ? "Latest Assessment" : run.assessment_type}
                  </p>
                </div>
                <p className="text-[11px] font-semibold text-gs-muted mt-1">
                  {run.readiness_score}% · {formatDate(run.created_at)}
                </p>
              </button>
              <button onClick={() => onDeleteRun(run)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-red-500 hover:underline">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function GlobalGapAssessmentContent() {
  const searchParams = useSearchParams();
  const { canAccess, loading: subLoading } = useSubscription();
  const initialProjectId = searchParams.get("projectId") ?? undefined;
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(initialProjectId);
  const [projectRuns, setProjectRuns] = useState<GapAssessmentRun[]>([]);
  const [projectRunsLoading, setProjectRunsLoading] = useState(false);
  const [data, setData] = useState<GapAssessmentResponse | null>(null);
  const [basis, setBasis] = useState<AssessmentBasis | null>(null);
  const [loading, setLoading] = useState(false);
  const [backgroundRun, setBackgroundRun] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    projectApi.list({ page_size: 100 }).then(res => setProjects(res.items)).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (searchParams.get("assessmentId") || initialProjectId) return;
    setLoading(true);
    assessmentApi.getGlobalGap(undefined, undefined, undefined, undefined, "chat")
      .then(res => {
        setData(res);
        setBasis({
          assessmentType: "Global Development Readiness",
          sourceType: "Chat Analysis",
          documentsReviewed: res.documents_reviewed,
          regions: ["Global"],
          lastRun: formatDate(new Date()),
          confidence: "Moderate",
        });
      })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load default assessment"))
      .finally(() => setLoading(false));
  }, [initialProjectId, searchParams]);

  useEffect(() => {
    if (initialProjectId && !searchParams.get("assessmentId")) {
      setSetupOpen(true);
    }
  }, [initialProjectId, searchParams]);

  useEffect(() => {
    const runId = searchParams.get("assessmentId");
    if (!runId) return;
    assessmentApi.getRun(runId).then(run => {
      if (run.project_id) {
        setSelectedProjectId(run.project_id);
        assessmentApi.listProjectRuns(run.project_id).then(setProjectRuns).catch(() => undefined);
      }
      setBasis({
        assessmentType: run.assessment_type,
        sourceType: run.source_type,
        projectName: projects.find(project => project.id === run.project_id)?.name,
        documentsReviewed: run.documents_reviewed,
        regions: run.regions,
        lastRun: formatDate(run.created_at),
        confidence: run.confidence_level,
      });
      assessmentApi.getGlobalGap(undefined, undefined, run.project_id ?? undefined, run.document_ids)
        .then(setData)
        .catch(() => undefined);
    }).catch(() => undefined);
  }, [projects, searchParams]);

  const hasResults = Boolean(data);
  const lastRunDate = useMemo(() => formatDate(new Date()), []);

  async function refreshProjectRuns(projectId: string) {
    setProjectRunsLoading(true);
    try {
      const runs = await assessmentApi.listProjectRuns(projectId);
      setProjectRuns(runs);
      return runs;
    } finally {
      setProjectRunsLoading(false);
    }
  }

  async function showRun(run: GapAssessmentRun) {
    const project = projects.find(item => item.id === run.project_id);
    setSelectedProjectId(run.project_id ?? undefined);
    setLoading(true);
    setError(null);
    try {
      const res = await assessmentApi.getGlobalGap(undefined, undefined, run.project_id ?? undefined, run.document_ids);
      setData(res);
      setBasis({
        assessmentType: run.assessment_type,
        sourceType: run.source_type,
        projectName: project?.name,
        documentsReviewed: run.documents_reviewed.length ? run.documents_reviewed : res.documents_reviewed,
        regions: run.regions,
        lastRun: formatDate(run.created_at),
        confidence: run.confidence_level,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assessment");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectProject(project: Project) {
    setSelectedProjectId(project.id);
    setError(null);
    const runs = await refreshProjectRuns(project.id);
    if (runs[0]) {
      await showRun(runs[0]);
      return;
    }
    setData(null);
    setBasis(null);
    setLoading(false);
  }

  async function handleDeleteRun(run: GapAssessmentRun) {
    try {
      await assessmentApi.deleteRun(run.id);
      const remaining = projectRuns.filter(item => item.id !== run.id);
      setProjectRuns(remaining);
      if (run.project_id === selectedProjectId) {
        if (remaining[0]) {
          await showRun(remaining[0]);
        } else {
          setData(null);
          setBasis(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete assessment");
    }
  }

  async function handleRun(settings: SetupRunSettings) {
    setSetupOpen(false);
    setBackgroundRun(true);
    setLoading(true);
    setError(null);
    try {
      let projectId = settings.projectId || undefined;
      let projectName = settings.projectName;

      if ((settings.source === "upload" || settings.source === "paste" || settings.source === "general") && settings.saveMode === "new") {
        const created = await projectApi.create({
          name: settings.newProject.name,
          type: settings.newProject.type,
          indication: settings.newProject.indication || null,
          therapeutic_area: settings.newProject.therapeutic_area || null,
          dev_phase: settings.newProject.dev_phase || null,
          product_type: settings.newProject.product_type || null,
          status: "Planning",
        });
        projectId = created.id;
        projectName = created.name;
        setProjects(prev => [created, ...prev]);
      }

      const uploadedDocs: AssessmentDocumentSummary[] = [];
      if (settings.source === "upload") {
        for (const file of settings.files) {
          const doc = await assessmentApi.uploadForAnalysis(file, settings.authority, settings.saveMode === "none" ? undefined : projectId);
          uploadedDocs.push({
            id: doc.id,
            filename: doc.filename,
            file_type: doc.file_type,
            authority: doc.authority,
            source: "Gap Assessment",
            created_at: doc.created_at,
          });
        }
      }

      const documentIds = uploadedDocs.map(doc => doc.id);
      const projectFilter =
        settings.source === "project" ||
        ((settings.source === "upload" || settings.source === "paste" || settings.source === "general") && settings.saveMode !== "none")
          ? projectId
          : undefined;
      let res: GapAssessmentResponse | null = null;
      let savedRun: GapAssessmentRun | null = null;

      if (settings.source === "paste" || settings.source === "general") {
        res = await assessmentApi.runManual({
            program_details: settings.programDetails,
            source_type: sourceLabel(settings.source),
            assessment_type: settings.assessmentType,
            authority: settings.authority,
            project_id: projectFilter,
            confidence_level: settings.source === "general" ? "Low" : "Moderate",
          });
      }

      if (projectFilter) {
        const assessedDocumentIds = res?.documents_reviewed.map(doc => doc.id) ?? [];
        savedRun = await assessmentApi.createRun({
          source_type: sourceLabel(settings.source),
          assessment_type: settings.assessmentType,
          regions: [settings.authority || "Global"],
          project_id: projectFilter,
          document_ids: assessedDocumentIds.length ? assessedDocumentIds : documentIds,
          confidence_level: settings.source === "general" ? "Low" : "Moderate",
        });
        setSelectedProjectId(projectFilter);
        const runs = await assessmentApi.listProjectRuns(projectFilter);
        setProjectRuns(runs);
        res = await assessmentApi.getGlobalGap(undefined, undefined, savedRun.project_id ?? undefined, savedRun.document_ids);
      } else if (!res) {
        res = await assessmentApi.getGlobalGap(settings.authority, undefined, undefined, documentIds);
      }

      setData(res);
      setBasis({
        assessmentType: settings.assessmentType,
        sourceType: sourceLabel(settings.source),
        projectName,
        documentsReviewed: savedRun?.documents_reviewed.length ? savedRun.documents_reviewed : res.documents_reviewed.length ? res.documents_reviewed : uploadedDocs,
        regions: [settings.authority || "Global"],
        lastRun: savedRun ? formatDate(savedRun.created_at) : lastRunDate,
        confidence: savedRun?.confidence_level || (settings.source === "general" ? "Low" : "Moderate"),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run assessment");
    } finally {
      setLoading(false);
      setBackgroundRun(false);
    }
  }

  if (subLoading) return null;

  return (
    <UpgradeGate feature="gap_assessment" canAccess={canAccess("gap_assessment")}>
    <div className="min-h-screen bg-gs-bg p-4 md:p-10 font-sans antialiased text-gs-text">
      <div className="max-w-7xl mx-auto">
        <GapPageHeader onNewAssessment={() => setSetupOpen(true)} />

        {error && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
            <p className="text-[13px] font-bold text-red-700">{error}</p>
          </div>
        )}

        {backgroundRun && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <Clock size={18} className="text-indigo-500 shrink-0 animate-pulse" />
            <p className="text-[13px] font-bold text-indigo-700">
              Running gap assessment in the background. You can keep working; you will receive a notification when it is ready.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-10 min-w-0">
            {!hasResults && !loading && (
              <div className="bg-gs-card border border-gs-border rounded-xl shadow-sm p-10 mb-8 text-center">
                <ShieldCheck size={34} className="mx-auto text-blue-600 mb-4" />
                <h2 className="text-xl font-bold text-gs-text mb-2">
                  {selectedProjectId ? "No saved assessment for this project" : "No chat-based assessment data yet"}
                </h2>
                <p className="text-sm font-medium text-gs-muted max-w-2xl mx-auto mb-6">
                  {selectedProjectId
                    ? "Run a new gap assessment to create fresh results for the selected project."
                    : "The default view uses AI gap analysis from documents uploaded in Regulatory Chat. Start a new assessment to use a project, upload documents, paste program details, or run a general assessment."}
                </p>
                <button onClick={() => setSetupOpen(true)} className="h-10 px-5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">
                  Start New Assessment
                </button>
              </div>
            )}

            {basis && <AssessmentBasisPanel basis={basis} onSettings={() => setSetupOpen(true)} />}

            {(hasResults || loading) && (
              <>
                <GapStatCards data={data} loading={loading} />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                  <ReadinessByDomain data={data?.domain_readiness ?? []} loading={loading} />
                  <GapSeverityDonut data={data?.severity_distribution ?? []} loading={loading} />
                  <GapNextSteps data={data?.next_steps ?? []} loading={loading} />
                </div>
                <GapTableSection data={data?.top_gaps ?? []} loading={loading} />
              </>
            )}
          </div>
          <ProjectAssessmentPanel
            projects={projects}
            selectedProjectId={selectedProjectId}
            runs={projectRuns}
            loading={projectRunsLoading}
            onSelectProject={handleSelectProject}
            onSelectRun={showRun}
            onDeleteRun={handleDeleteRun}
          />
        </div>

        <footer className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-[#94A3B8] font-bold text-[11px] uppercase tracking-[0.15em]">
            <ShieldCheck size={18} className="text-[#10B981]" /> All assessments are secure and confidential.
          </div>
          <p className="text-[#CBD5E1] text-[11px] font-medium max-w-[600px] text-center">
            Data is encrypted and stored in compliance with global data protection standards. AI analysis is for informational purposes only.
          </p>
        </footer>
      </div>
      <SetupModal open={setupOpen} projects={projects} initialProjectId={initialProjectId} onClose={() => setSetupOpen(false)} onRun={handleRun} running={loading} />
    </div>
    </UpgradeGate>
  );
}

export default function GlobalGapAssessmentPage() {
  return (
    <Suspense fallback={null}>
      <GlobalGapAssessmentContent />
    </Suspense>
  );
}
