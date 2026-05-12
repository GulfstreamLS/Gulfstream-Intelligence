"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Plus, ShieldCheck, ChevronDown, Folder, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { SimulationScenario }  from "../../../../components/ha-simulation/SimulationScenario";
import { HaStatCards }         from "../../../../components/ha-simulation/HaStatCards";
import { SimulatedFeedback }   from "../../../../components/ha-simulation/SimulatedFeedback";
import { SimulationSidePanel } from "../../../../components/ha-simulation/SimulationSidePanel";
import { HaBottomCards }       from "../../../../components/ha-simulation/HaBottomCards";
import { simulationApi, projectApi } from "../../../../lib/api";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useSubscription }  from "../../../../hooks/useSubscription";
import { UpgradeGate }      from "../../../../components/ui/UpgradeGate";
import type { Project, SimulationListItem, SimulationSession } from "../../../../types";

const DEFAULT_AUTHORITY      = "FDA";
const DEFAULT_SUBMISSION_TYPE = "IND";
const DEFAULT_PRODUCT_TYPE   = "Small Molecule";
const DEFAULT_STAGE          = "Preclinical";
const DEFAULT_FOCUS_AREA     = "CMC & Manufacturing";

function ProjectPicker({
  projects, selected, onSelect,
}: {
  projects: Project[]; selected: Project | null; onSelect: (p: Project | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 border border-gs-border bg-gs-card text-gs-text rounded-lg text-xs font-semibold hover:bg-gs-bg transition-colors max-w-[160px]"
      >
        <Folder size={13} className="text-indigo-500 shrink-0" />
        <span className="truncate">{selected ? selected.name : "Select Project"}</span>
        <ChevronDown size={13} className={`text-gs-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-64 bg-gs-card border border-gs-border rounded-xl shadow-lg overflow-hidden">
          <div
            onClick={() => { onSelect(null); setOpen(false); }}
            className={`px-4 py-3 text-sm font-semibold cursor-pointer hover:bg-gs-bg ${!selected ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" : "text-gs-muted"}`}
          >
            No project (standalone)
          </div>
          <div className="border-t border-gs-border" />
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => { onSelect(p); setOpen(false); }}
              className={`px-4 py-3 cursor-pointer hover:bg-gs-bg ${selected?.id === p.id ? "bg-indigo-50 dark:bg-indigo-950/40" : ""}`}
            >
              <p className="text-sm font-semibold text-gs-text">{p.name}</p>
              <p className="text-[10px] font-bold text-gs-muted uppercase mt-0.5">
                {p.type} · {p.dev_phase ?? "—"} · {(p.authorities ?? []).join(", ") || "No authorities"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionHistoryDropdown({
  sessions, activeId, onSelect, onDelete,
}: {
  sessions: SimulationListItem[]; activeId: string | null;
  onSelect: (id: string) => void; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const active = sessions.find(s => s.id === activeId);

  // Group sessions by project (must be before any early return)
  const groups = useMemo(() => {
    const map = new Map<string, { name: string | null; items: SimulationListItem[] }>();
    for (const s of sessions) {
      const key = s.project_id ?? "standalone";
      if (!map.has(key)) map.set(key, { name: s.project_name ?? null, items: [] });
      map.get(key)!.items.push(s);
    }
    return Array.from(map.entries());
  }, [sessions]);

  if (sessions.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 border border-gs-border bg-gs-card text-gs-text rounded-lg text-xs font-semibold hover:bg-gs-bg transition-colors max-w-[170px]"
      >
        <span className="truncate">
          {active ? `${active.authority} · ${active.focus_area}` : "History"}
        </span>
        <ChevronDown size={13} className={`text-gs-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-80 bg-gs-card border border-gs-border rounded-xl shadow-lg overflow-hidden max-h-[400px] overflow-y-auto">
          {groups.map(([groupKey, group]) => (
            <div key={groupKey}>
              {/* Project group header */}
              <div className="px-4 py-2 bg-gs-bg border-b border-gs-border sticky top-0">
                <div className="flex items-center gap-1.5">
                  <Folder size={11} className="text-indigo-400 shrink-0" />
                  <p className="text-[10px] font-bold text-gs-muted uppercase tracking-wider truncate">
                    {group.name ?? "Standalone"}
                  </p>
                </div>
              </div>
              {/* Sessions within group */}
              {group.items.map(s => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between px-4 py-3 pl-7 cursor-pointer hover:bg-gs-bg group ${s.id === activeId ? "bg-indigo-50 dark:bg-indigo-950/40" : ""}`}
                  onClick={() => { onSelect(s.id); setOpen(false); }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gs-text truncate">{s.authority} · {s.focus_area}</p>
                    <p className="text-[10px] font-bold text-gs-muted uppercase mt-0.5">
                      {s.submission_type} · {s.stage} · {Math.round(s.readiness_score)}% · {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-gs-muted transition-all shrink-0 ml-2"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
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
  const router = useRouter();

  // Projects
  const [projects, setProjects]   = useState<Project[]>([]);
  const [project, setProject]     = useState<Project | null>(null);

  // Scenario fields
  const [authority,      setAuthority]      = useState(DEFAULT_AUTHORITY);
  const [submissionType, setSubmissionType] = useState(DEFAULT_SUBMISSION_TYPE);
  const [productType,    setProductType]    = useState(DEFAULT_PRODUCT_TYPE);
  const [stage,          setStage]          = useState(DEFAULT_STAGE);
  const [focusArea,      setFocusArea]      = useState(DEFAULT_FOCUS_AREA);

  // Session data
  const [sessions,      setSessions]      = useState<SimulationListItem[]>([]);
  const [activeSession, setActiveSession] = useState<SimulationSession | null>(null);
  const [activeId,      setActiveId]      = useState<string | null>(null);

  // Chat count for selected project (null = standalone / not checked yet)
  const [projectChatCount, setProjectChatCount] = useState<number | null>(null);

  // UI state
  const [running,  setRunning]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    projectApi.list().then(r => setProjects(r.items)).catch(() => {});
  }, []);

  // Handle URL params
  useEffect(() => {
    if (projects.length === 0) return;
    const pid = searchParams.get("projectId");
    const sid = searchParams.get("sessionId");
    if (pid) {
      const found = projects.find(p => p.id === pid);
      if (found) handleProjectSelect(found);
    }
    if (sid) loadSession(sid);
  }, [searchParams, projects]);

  const handleProjectSelect = (p: Project | null) => {
    setProject(p);
    if (p) {
      const auths = p.authorities ?? [];
      if (auths.length > 0) setAuthority(auths[0]);
      if (p.type)         setSubmissionType(p.type);
      if (p.dev_phase)    setStage(p.dev_phase);
      if (p.product_type) setProductType(p.product_type);
    }
  };

  // Fetch chat count when project changes
  useEffect(() => {
    if (!project) { setProjectChatCount(null); return; }
    projectApi.getConversations(project.id)
      .then(convos => setProjectChatCount(convos.length))
      .catch(() => setProjectChatCount(0));
  }, [project]);

  const loadSessions = useCallback(async (projectId?: string) => {
    try {
      const list = await simulationApi.listSessions(projectId);
      setSessions(list);
      return list;
    } catch { setSessions([]); return []; }
  }, []);

  useEffect(() => {
    if (!project) { loadSessions(undefined); return; }
    loadSessions(project.id).then(list => {
      // Auto-open the latest session whenever a project is selected
      if (list.length > 0) loadSession(list[0].id);
      else { setActiveSession(null); setActiveId(null); }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

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
    } catch { setError("Failed to load session."); }
    finally  { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await simulationApi.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeId === id) { setActiveSession(null); setActiveId(null); }
    } catch {}
  };

  const handleRunSimulation = async () => {
    setRunning(true);
    setError(null);
    try {
      const session = await simulationApi.run({
        project_id:      project?.id,
        authority,
        submission_type: submissionType,
        product_type:    productType,
        stage,
        focus_area:      focusArea,
      });
      setActiveSession(session);
      setActiveId(session.id);
      await loadSessions(project?.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed.");
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
            <h1 className="text-2xl md:text-3xl font-bold text-gs-text tracking-tight">Health Authority Simulation</h1>
            <p className="text-gs-muted text-sm mt-1 max-w-2xl">
              Prepare. Anticipate. Respond. Simulate questions and feedback from health authorities to strengthen your position.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <ProjectPicker projects={projects} selected={project} onSelect={handleProjectSelect} />
            <SessionHistoryDropdown
              sessions={sessions}
              activeId={activeId}
              onSelect={loadSession}
              onDelete={handleDelete}
            />
            <button className="flex items-center gap-1.5 px-3 py-2 border border-gs-border bg-gs-card text-gs-text rounded-lg text-xs font-semibold hover:bg-gs-bg transition-colors whitespace-nowrap">
              <Download size={14} className="text-indigo-600" /> Export
            </button>
            <button
              onClick={handleRunSimulation}
              disabled={running || (project !== null && projectChatCount === 0)}
              title={project && projectChatCount === 0 ? "Start a chat in this project first" : undefined}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-shadow shadow-md disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {running
                ? <><Loader2 size={14} className="animate-spin" /> Running…</>
                : <><Plus size={14} /> New Simulation</>}
            </button>
          </div>
        </div>

        {/* No-chat warning — shown when a project is selected but has no chats yet */}
        {project && projectChatCount === 0 && !running && (
          <div className="flex items-center justify-between gap-4 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
              <p className="text-[13px] font-bold text-amber-800">
                <span className="font-extrabold">{project.name}</span> has no regulatory chats yet.
                Start a chat first so the simulation has document context to analyse.
              </p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/chat?projectId=${project.id}`)}
              className="shrink-0 px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 whitespace-nowrap"
            >
              Start Chat →
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
            <p className="text-[13px] font-bold text-red-700">{error}</p>
          </div>
        )}

        {running && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <Loader2 size={18} className="text-indigo-500 animate-spin shrink-0" />
            <p className="text-[13px] font-bold text-indigo-700">
              Running simulation for {authority} · {focusArea} — this may take 15–30 seconds…
            </p>
          </div>
        )}

        <SimulationScenario
          project={project}
          authority={authority}           onAuthorityChange={setAuthority}
          submissionType={submissionType} onSubmissionTypeChange={setSubmissionType}
          productType={productType}       onProductTypeChange={setProductType}
          stage={stage}                   onStageChange={setStage}
          focusArea={focusArea}           onFocusAreaChange={setFocusArea}
          lastRun={lastRun}
        />

        <HaStatCards session={activeSession} loading={running || loading} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <SimulatedFeedback   session={activeSession} loading={running || loading} />
          <SimulationSidePanel session={activeSession} loading={running || loading} />
        </div>

        <HaBottomCards session={activeSession} loading={running || loading} />

        <div className="flex flex-col items-center text-center border-t border-gs-border gap-2 pt-6">
          <div className="flex items-center gap-2 text-gs-muted font-bold text-[10px] uppercase tracking-wider">
            <ShieldCheck size={14} className="text-emerald-500" />
            Simulations are for preparation purposes only and do not replace official guidance.
          </div>
          <p className="text-gs-muted text-[10px] font-bold">All data is secure and confidential.</p>
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
