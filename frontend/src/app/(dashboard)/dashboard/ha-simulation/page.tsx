"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Play,
  ShieldCheck,
  Folder,
  Trash2,
  AlertTriangle,
  Loader2,
  History,
  X,
  Plus,
} from "lucide-react";
import { SimulationScenario } from "../../../../components/ha-simulation/SimulationScenario";
import { SupplementalInput } from "../../../../components/ha-simulation/SupplementalInput";
import { SourceContextSummary } from "../../../../components/ha-simulation/SourceContextSummary";
import { HaStatCards } from "../../../../components/ha-simulation/HaStatCards";
import { SimulatedFeedback } from "../../../../components/ha-simulation/SimulatedFeedback";
import { SimulationSidePanel } from "../../../../components/ha-simulation/SimulationSidePanel";
import { HaBottomCards } from "../../../../components/ha-simulation/HaBottomCards";
import {
  ALL_SOURCE_KEYS,
  runButtonLabel,
  type SimulationMode,
} from "../../../../components/ha-simulation/simulationConstants";
import { simulationApi, projectApi } from "../../../../lib/api";
import { Suspense } from "react";
import { useSubscription } from "../../../../hooks/useSubscription";
import { UpgradeGate } from "../../../../components/ui/UpgradeGate";
import type {
  Project,
  ProjectDocument,
  SimulationListItem,
  SimulationSession,
} from "../../../../types";

const DEFAULT_AUTHORITY = "FDA";
const DEFAULT_SUBMISSION_TYPE = "IND";
const DEFAULT_PRODUCT_TYPE = "Small Molecule";
const DEFAULT_STAGE = "Preclinical";
const DEFAULT_FOCUS_AREA = "CMC & Manufacturing";
const QUESTIONNAIRE_FILENAMES = [
  "pasted-questions",
  "simulation-questionnaire",
];

function isQuestionnaireDocument(doc: ProjectDocument) {
  const filename = doc.filename.toLowerCase();
  return QUESTIONNAIRE_FILENAMES.some((name) => filename.startsWith(name));
}

function SimulationHistoryPanel({
  sessions,
  activeId,
  onSelect,
  onDelete,
}: {
  sessions: SimulationListItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="w-[320px] max-w-full h-[calc(90vh-40px)] overflow-hidden bg-gs-card rounded-xl border border-gs-border shadow-sm p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <History size={14} className="text-indigo-500" />
        <h3 className="font-bold text-gs-text">Simulation History</h3>
      </div>
      {sessions.length === 0 ? (
        <p className="text-[12px] font-semibold text-gs-muted">
          No simulations run yet.
        </p>
      ) : (
        <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors group cursor-pointer ${
                s.id === activeId
                  ? "border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-gs-border hover:bg-gs-bg"
              }`}
            >
              <Folder size={14} className="text-indigo-500 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gs-text truncate">
                  {s.authority} · {s.focus_area}
                </p>
                <p className="text-[10px] font-bold text-gs-muted uppercase mt-0.5">
                  {s.project_name ?? "Standalone"} · {s.submission_type} ·{" "}
                  {Math.round(s.readiness_score)}%
                </p>
                <p className="text-[10px] font-bold text-gs-muted uppercase mt-0.5">
                  {new Date(s.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(s.id);
                }}
                className="p-1 text-gs-muted hover:text-red-500 transition-colors shrink-0"
                aria-label={`Delete ${s.authority} ${s.focus_area} simulation`}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HealthAuthoritySimulationPage() {
  const { canAccess, loading: subLoading } = useSubscription();
  const searchParams = useSearchParams();

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);

  // Mode + scenario
  const [mode, setMode] = useState<SimulationMode>("project");
  const [authority, setAuthority] = useState(DEFAULT_AUTHORITY);
  const [submissionType, setSubmissionType] = useState(DEFAULT_SUBMISSION_TYPE);
  const [productType, setProductType] = useState(DEFAULT_PRODUCT_TYPE);
  const [stage, setStage] = useState(DEFAULT_STAGE);
  const [focusArea, setFocusArea] = useState(DEFAULT_FOCUS_AREA);
  const [simulationPurpose, setSimulationPurpose] = useState("");

  // Supplemental input
  const [pastedQuestions, setPastedQuestions] = useState("");
  const [manualScenario, setManualScenario] = useState("");
  const [sessionDocs, setSessionDocs] = useState<ProjectDocument[]>([]);
  const [projectDocs, setProjectDocs] = useState<ProjectDocument[]>([]);
  const [docSaveToProject, setDocSaveToProject] = useState(true);
  const [pastedSaveToProject, setPastedSaveToProject] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [includedSources, setIncludedSources] =
    useState<string[]>(ALL_SOURCE_KEYS);

  // Session data
  const [sessions, setSessions] = useState<SimulationListItem[]>([]);
  const [activeSession, setActiveSession] = useState<SimulationSession | null>(
    null,
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // UI state
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load projects on mount
  useEffect(() => {
    projectApi
      .list()
      .then((r) => setProjects(Array.isArray(r.items) ? r.items : []))
      .catch(() => setProjects([]));
  }, []);

  const resetSupplementalInputs = () => {
    setSessionDocs([]);
    setPastedQuestions("");
    setManualScenario("");
    setDocSaveToProject(true);
    setPastedSaveToProject(true);
    setIncludedSources(ALL_SOURCE_KEYS);
  };

  const handleModeChange = (next: SimulationMode) => {
    if (next === mode) return;
    resetSupplementalInputs();
    setActiveSession(null);
    setActiveId(null);
    setMode(next);
    if (next === "standalone") {
      setProject(null);
      setProjectDocs([]);
    } else if (!project && projects.length > 0) {
      handleProjectSelect(projects[0]);
    }
  };

  const handleProjectSelect = (p: Project | null) => {
    setProject(p);
    resetSupplementalInputs();
    setProjectDocs([]);
    if (p) {
      const auths = p.authorities ?? [];
      if (auths.length > 0) setAuthority(auths[0]);
      if (p.type) setSubmissionType(p.type);
      if (p.dev_phase) setStage(p.dev_phase);
      if (p.product_type) setProductType(p.product_type);
    }
  };

  // Handle URL params
  useEffect(() => {
    if (projects.length === 0) return;
    const pid = searchParams.get("projectId");
    const sid = searchParams.get("sessionId");
    if (pid) {
      const found = projects.find((p) => p.id === pid);
      if (found) handleProjectSelect(found);
    } else if (!sid && mode === "project" && !project) {
      handleProjectSelect(projects[0]);
    }
    if (sid) loadSession(sid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, projects, mode, project]);

  // Fetch saved project documents when the project changes
  useEffect(() => {
    if (!project) {
      setProjectDocs([]);
      return;
    }
    projectApi
      .listDocuments(project.id)
      .then((docs) => {
        const safeDocs = Array.isArray(docs) ? docs : [];
        setProjectDocs(safeDocs);
      })
      .catch(() => {
        setProjectDocs([]);
      });
  }, [project]);

  const loadSessions = useCallback(async (projectId?: string | null) => {
    try {
      const raw = await simulationApi.listSessions(projectId ?? undefined);
      const list = Array.isArray(raw) ? raw : [];
      const visible = projectId === null ? list.filter((s) => !s.project_id) : list;
      setSessions(visible);
      return visible;
    } catch {
      setSessions([]);
      return [];
    }
  }, []);

  useEffect(() => {
    if (mode === "standalone") {
      loadSessions(null).then((list) => {
        if (list.length > 0) loadSession(list[0].id);
        else {
          setActiveSession(null);
          setActiveId(null);
        }
      });
      return;
    }
    if (!project) {
      setSessions([]);
      setActiveSession(null);
      setActiveId(null);
      return;
    }
    loadSessions(project.id).then((list) => {
      if (list.length > 0) loadSession(list[0].id);
      else {
        setActiveSession(null);
        setActiveId(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, project]);

  const loadSession = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const s = await simulationApi.getSession(id);
      setActiveSession(s);
      setActiveId(id);
      setAuthority(s.authority);
      setSubmissionType(s.submission_type);
      setProductType(s.product_type);
      setStage(s.stage);
      setFocusArea(s.focus_area);
    } catch {
      setError("Failed to load session.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await simulationApi.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeId === id) {
        setActiveSession(null);
        setActiveId(null);
      }
    } catch {}
  };

  const handleUpload = async (file: File) => {
    if (mode === "project" && !project) return;
    setUploadingDoc(true);
    setError(null);
    try {
      const doc = project
        ? await projectApi.uploadDocument(project.id, file, docSaveToProject)
        : await projectApi.uploadStandaloneDocument(file);
      setSessionDocs((prev) => [...prev, doc]);
      if (docSaveToProject && project) {
        const docs = await projectApi.listDocuments(project.id);
        setProjectDocs(Array.isArray(docs) ? docs : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Document upload failed.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDocument = async (doc: ProjectDocument) => {
    setError(null);
    setSessionDocs((prev) => prev.filter((d) => d.id !== doc.id));
    try {
      if (doc.project_id) {
        await projectApi.deleteDocument(doc.project_id, doc.id);
        if (project?.id === doc.project_id) {
          const docs = await projectApi.listDocuments(project.id);
          setProjectDocs(Array.isArray(docs) ? docs : []);
        }
      } else {
        await projectApi.deleteStandaloneDocument(doc.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Document removal failed.");
      if (project)
        projectApi
          .listDocuments(project.id)
          .then((docs) => setProjectDocs(Array.isArray(docs) ? docs : []))
          .catch(() => {});
    }
  };

  const handleRemoveProjectDocument = async (doc: ProjectDocument) => {
    if (!doc.project_id) return;
    setError(null);
    try {
      await projectApi.deleteDocument(doc.project_id, doc.id);
      setSessionDocs((prev) => prev.filter((d) => d.id !== doc.id));
      if (project?.id === doc.project_id) {
        const docs = await projectApi.listDocuments(project.id);
        setProjectDocs(Array.isArray(docs) ? docs : []);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Project document removal failed.",
      );
    }
  };

  const toggleSource = (key: string) => {
    setIncludedSources((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const simulationUploadedDocuments = sessionDocs.filter(
    (d) => !isQuestionnaireDocument(d),
  );
  const projectUploadedDocuments = projectDocs.filter(
    (d) => !isQuestionnaireDocument(d),
  );
  const projectQuestionnaires = projectDocs.filter(isQuestionnaireDocument);
  const priorGapAssessmentCount = projectUploadedDocuments.filter(
    (doc) => (doc.gap_count ?? 0) > 0,
  ).length;
  const chatOutputCount = projectUploadedDocuments.filter(
    (doc) => Boolean(doc.conversation_id),
  ).length;
  const pastedQuestionCount =
    (pastedQuestions.trim() ? 1 : 0) + projectQuestionnaires.length;

  const sourceCounts: Record<string, number | null> = {
    project_profile: mode === "project" && project ? 1 : 0,
    project_documents: projectUploadedDocuments.length,
    supplemental_documents: simulationUploadedDocuments.length,
    prior_gap_assessment: priorGapAssessmentCount,
    chat_outputs: chatOutputCount,
    regulatory_core: mode === "project" && project ? 1 : 0,
    pasted_questions: pastedQuestionCount,
    manual_scenario: manualScenario.trim() ? 1 : 0,
    prior_simulations: sessions.length,
  };

  // ── Run gating ────────────────────────────────────────────────────────────
  const scenarioComplete =
    !!authority && !!submissionType && !!productType && !!stage && !!focusArea;
  const purposeSet = !!simulationPurpose;
  const sourceCanContribute = (key: string) =>
    includedSources.includes(key) && (sourceCounts[key] ?? 0) > 0;
  const hasSource =
    mode === "project"
      ? [
          "project_profile",
          "project_documents",
          "supplemental_documents",
          "prior_gap_assessment",
          "chat_outputs",
          "regulatory_core",
          "pasted_questions",
          "manual_scenario",
          "prior_simulations",
        ].some(sourceCanContribute)
      : ["supplemental_documents", "pasted_questions", "manual_scenario"].some(
          sourceCanContribute,
        );
  const hasIncludedDocumentContext =
    mode !== "project" ||
    sourceCanContribute("project_documents") ||
    sourceCanContribute("supplemental_documents");
  const canRun = scenarioComplete && purposeSet && hasSource && hasIncludedDocumentContext;

  const gateLabel =
    mode === "project"
      ? "Add Project Context to Run"
      : "Add Source Context to Run";
  const readyLabel = runButtonLabel(
    simulationPurpose,
    authority,
    mode,
    project?.name,
  );
  const runHelperText =
    mode === "project" && !hasIncludedDocumentContext
      ? "Upload or include at least one project or supplemental document before running this simulation."
      : canRun
        ? "All set — your simulation is ready to run."
        : "Select a simulation purpose and add source context to enable.";

  const handleRunSimulation = async () => {
    if (!canRun || running) return false;
    setRunning(true);
    setError(null);
    try {
      // Optionally persist pasted content to the project for future reuse.
      if (
        mode === "project" &&
        project &&
        pastedSaveToProject &&
        pastedQuestions.trim()
      ) {
        try {
          const f = new File([pastedQuestions], "pasted-questions.txt", {
            type: "text/plain",
          });
          await projectApi.uploadDocument(project.id, f, true);
          await projectApi
            .listDocuments(project.id)
            .then(setProjectDocs)
            .catch(() => {});
        } catch {
          /* non-fatal */
        }
      }

      const session = await simulationApi.run({
        project_id: mode === "project" ? project?.id : undefined,
        authority,
        submission_type: submissionType,
        product_type: productType,
        stage,
        focus_area: focusArea,
        mode,
        simulation_purpose: simulationPurpose,
        pasted_questions: pastedQuestions.trim() || undefined,
        manual_scenario: manualScenario.trim() || undefined,
        included_sources: includedSources,
        supplemental_document_ids: sessionDocs.map((d) => d.id),
      });
      setActiveSession(session);
      setActiveId(session.id);
      await loadSessions(mode === "project" ? project?.id : null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed.");
      return false;
    } finally {
      setRunning(false);
    }
  };

  const lastRun = sessions[0] ?? null;

  if (subLoading) return null;

  return (
    <UpgradeGate feature="ha_simulation" canAccess={canAccess("ha_simulation")}>
      <div className="min-h-screen bg-gs-bg p-4 md:p-8 font-sans text-gs-text">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gs-text tracking-tight">
                Health Authority Simulation
              </h1>
              <p className="text-gs-muted text-sm mt-1 max-w-2xl">
                Prepare. Anticipate. Respond. Simulate questions and feedback
                from health authorities to strengthen your position.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-sm"
              >
                <Plus size={14} /> New Simulation
              </button>
              {/*
              <button className="flex items-center gap-1.5 px-3 py-2 border border-gs-border bg-gs-card text-gs-text rounded-lg text-xs font-semibold hover:bg-gs-bg transition-colors whitespace-nowrap">
                <Download size={14} className="text-indigo-600" /> Export
              </button>
              */}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={18} className="text-red-500 shrink-0" />
              <p className="text-[13px] font-bold text-red-700">{error}</p>
            </div>
          )}

          {running && (
            <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <Loader2
                size={18}
                className="text-indigo-500 animate-spin shrink-0"
              />
              <p className="text-[13px] font-bold text-indigo-700">
                Running simulation for {authority} · {focusArea} — this may take
                15–30 seconds…
              </p>
            </div>
          )}
          <div className="flex gap-4">
            <div>
              {isModalOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300"
                  onClick={() => setIsModalOpen(false)}
                >
                  <div
                    data-dropdown-boundary
                    className="bg-gs-card rounded-2xl shadow-2xl w-full max-w-6xl p-6 border border-gs-border flex flex-col max-h-[90vh] transition-transform duration-300 scale-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gs-border mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-gs-text">
                          Configure Simulation Scenario & Context
                        </h3>
                        <p className="text-xs text-gs-muted mt-0.5">
                          Set your simulation parameters, add supplemental files, and customize active sources.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="text-gs-muted hover:text-gs-text transition-colors p-1.5 rounded-lg hover:bg-gs-bg"
                        aria-label="Close modal"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-6">
                      {/* Simulation Scenario Config */}
                      <SimulationScenario
                        project={project}
                        projects={projects}
                        onProjectSelect={handleProjectSelect}
                        mode={mode}
                        onModeChange={handleModeChange}
                        authority={authority}
                        onAuthorityChange={setAuthority}
                        submissionType={submissionType}
                        onSubmissionTypeChange={setSubmissionType}
                        productType={productType}
                        onProductTypeChange={setProductType}
                        stage={stage}
                        onStageChange={setStage}
                        focusArea={focusArea}
                        onFocusAreaChange={setFocusArea}
                        simulationPurpose={simulationPurpose}
                        onSimulationPurposeChange={setSimulationPurpose}
                        lastRun={lastRun}
                      />

                      {/* Inputs & Sources Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <SupplementalInput
                          mode={mode}
                          projectSelected={!!project}
                          projectName={project?.name ?? null}
                          documents={simulationUploadedDocuments}
                          projectQuestionnaires={projectQuestionnaires}
                          onUpload={handleUpload}
                          onRemoveDocument={handleRemoveDocument}
                          onRemoveProjectQuestionnaire={handleRemoveProjectDocument}
                          uploadingDoc={uploadingDoc}
                          docSaveToProject={docSaveToProject}
                          onDocSaveToProjectChange={setDocSaveToProject}
                          pastedQuestions={pastedQuestions}
                          onPastedQuestionsChange={setPastedQuestions}
                          pastedSaveToProject={pastedSaveToProject}
                          onPastedSaveToProjectChange={setPastedSaveToProject}
                          manualScenario={manualScenario}
                          onManualScenarioChange={setManualScenario}
                        />
                        <SourceContextSummary
                          mode={mode}
                          projectName={project?.name ?? null}
                          authority={authority}
                          submissionType={submissionType}
                          focusArea={focusArea}
                          simulationPurpose={simulationPurpose}
                          includedSources={includedSources}
                          onToggleSource={toggleSource}
                          sourceCounts={sourceCounts}
                        />
                      </div>
                    </div>

                    {/* Modal Footer / Run Bar */}
                    <div className="pt-4 border-t border-gs-border mt-6">
                      <div className="bg-gs-bg/60 dark:bg-gs-bg/30 rounded-xl border border-gs-border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                        <p className="text-[13px] text-gs-muted font-medium">
                          {runHelperText}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gs-border bg-gs-card text-gs-text rounded-lg text-sm font-semibold hover:bg-gs-bg transition-colors whitespace-nowrap w-full sm:w-auto min-h-[40px]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const didRun = await handleRunSimulation();
                              if (didRun) setIsModalOpen(false);
                            }}
                            disabled={!canRun || running}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto min-h-[40px]"
                          >
                            {running ? (
                              <>
                                <Loader2 size={15} className="animate-spin" /> Running…
                              </>
                            ) : !canRun ? (
                              gateLabel
                            ) : (
                              <>
                                <Play size={15} /> {readyLabel}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <HaStatCards
                session={activeSession}
                loading={running || loading}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                <SimulatedFeedback
                  session={activeSession}
                  loading={running || loading}
                />
                <SimulationSidePanel
                  session={activeSession}
                  loading={running || loading}
                />
              </div>

              <HaBottomCards
                session={activeSession}
                loading={running || loading}
              />

              <div className="flex flex-col items-center text-center border-t border-gs-border gap-2 pt-6">
                <div className="flex items-center gap-2 text-gs-muted font-bold text-[10px] uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Simulations are for preparation purposes only and do not
                  replace official guidance.
                </div>
                <p className="text-gs-muted text-[10px] font-bold">
                  All data is secure and confidential.
                </p>
              </div>
            </div>
          <aside className="xl:sticky xl:top-6 xl:self-start h-full">
              <SimulationHistoryPanel
                sessions={sessions}
                activeId={activeId}
                onSelect={loadSession}
                onDelete={handleDelete}
              />
            </aside>
          </div>
        </div>
      </div>
    </UpgradeGate>
  );
}

export default function Page() {
  return (
    <Suspense>
      <HealthAuthoritySimulationPage />
    </Suspense>
  );
}
