"use client";

import { useRef } from "react";
import { Upload, FileText, X, Loader2, MessageSquareQuote, PenLine } from "lucide-react";
import type { ProjectDocument } from "../../types";
import type { SimulationMode } from "./simulationConstants";

const ACCEPT = ".pdf,.doc,.docx,.txt";

function SaveChoice({
  value, onChange, saveLabel,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  saveLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2 mt-3">
      {[
        { v: true,  label: saveLabel },
        { v: false, label: "Use for this simulation only" },
      ].map(opt => (
        <button
          key={String(opt.v)}
          type="button"
          onClick={() => onChange(opt.v)}
          className="flex items-center gap-2 text-left"
        >
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
            value === opt.v ? "border-indigo-600" : "border-gs-border"
          }`}>
            {value === opt.v && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
          </span>
          <span className={`text-xs font-semibold ${value === opt.v ? "text-gs-text" : "text-gs-muted"}`}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export function SupplementalInput({
  mode,
  projectSelected,
  projectName,
  documents,
  projectQuestionnaires,
  onUpload,
  onRemoveDocument,
  onRemoveProjectQuestionnaire,
  uploadingDoc,
  docSaveToProject,
  onDocSaveToProjectChange,
  pastedQuestions,
  onPastedQuestionsChange,
  pastedSaveToProject,
  onPastedSaveToProjectChange,
  manualScenario,
  onManualScenarioChange,
}: {
  mode: SimulationMode;
  projectSelected: boolean;
  projectName: string | null;
  documents: ProjectDocument[];
  projectQuestionnaires: ProjectDocument[];
  onUpload: (file: File) => void;
  onRemoveDocument: (doc: ProjectDocument) => void;
  onRemoveProjectQuestionnaire: (doc: ProjectDocument) => void;
  uploadingDoc: boolean;
  docSaveToProject: boolean;
  onDocSaveToProjectChange: (v: boolean) => void;
  pastedQuestions: string;
  onPastedQuestionsChange: (v: string) => void;
  pastedSaveToProject: boolean;
  onPastedSaveToProjectChange: (v: boolean) => void;
  manualScenario: string;
  onManualScenarioChange: (v: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProject = mode === "project";

  const title = isProject ? "Supplemental Project Input" : "Simulation Input";
  const helper = isProject
    ? "Add documents, questions, or scenario details to strengthen this project simulation."
    : "Add documents, questions, or scenario details for this standalone simulation.";
  const pastedQuestionCount = (pastedQuestions.trim() ? 1 : 0) + projectQuestionnaires.length;

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (file) onUpload(file);
  }

  // Project mode requires a project before inputs are usable.
  if (isProject && !projectSelected) {
    return (
      <div className="lg:col-span-6 bg-gs-card rounded-xl border border-gs-border shadow-sm p-6">
        <h3 className="font-bold text-gs-text">{title}</h3>
        <p className="text-[13px] text-gs-muted mt-1">{helper}</p>
        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center border border-dashed border-gs-border rounded-xl">
          <FileText size={28} className="text-gs-muted mb-2" />
          <p className="text-sm font-bold text-gs-muted">Select a project to begin</p>
          <p className="text-xs text-gs-muted mt-1">Project-Based simulations start from the selected project.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-6 bg-gs-card rounded-xl border border-gs-border shadow-sm p-6 space-y-6">
      <div>
        <h3 className="font-bold text-gs-text">{title}</h3>
        <p className="text-[13px] text-gs-muted mt-1">{helper}</p>
      </div>

      {isProject && (
        <div className="border border-gs-border rounded-xl p-4 bg-indigo-50/60 dark:bg-indigo-950/20">
          <h4 className="text-sm font-bold text-gs-text mb-3">Source Context</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
            <div>
              <span className="font-bold text-gs-muted uppercase tracking-wide">Project</span>
              <p className="font-semibold text-gs-text mt-0.5">{projectName ?? "None selected"}</p>
            </div>
            <div>
              <span className="font-bold text-gs-muted uppercase tracking-wide">Documents</span>
              <p className="font-semibold text-gs-text mt-0.5">{documents.length} uploaded</p>
            </div>
            <div>
              <span className="font-bold text-gs-muted uppercase tracking-wide">Pasted Questions</span>
              <p className="font-semibold text-gs-text mt-0.5">{pastedQuestionCount}</p>
            </div>
            <div>
              <span className="font-bold text-gs-muted uppercase tracking-wide">Manual Inputs</span>
              <p className="font-semibold text-gs-text mt-0.5">{manualScenario.trim() ? "Added" : "Not started"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload card */}
      <div className="border border-gs-border rounded-xl p-4 bg-gs-bg">
        <div className="flex items-center gap-2 mb-1">
          <Upload size={15} className="text-indigo-500" />
          <h4 className="text-sm font-bold text-gs-text">
            {isProject ? "Upload Supplemental Project Documents" : "Upload Simulation Documents"}
          </h4>
        </div>
        <p className="text-[12px] text-gs-muted mb-3">
          {isProject
            ? "Upload files for this simulation and save them to the selected project."
            : "Upload files for this standalone simulation."}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleFiles}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingDoc}
          className="flex items-center gap-2 px-3 py-2 border border-gs-border rounded-lg bg-gs-card text-gs-text text-sm font-semibold hover:bg-gs-bg transition-colors disabled:opacity-60 min-h-[40px]"
        >
          {uploadingDoc
            ? <><Loader2 size={14} className="animate-spin" /> Uploading…</>
            : <><Upload size={14} className="text-gs-muted" /> Choose file</>}
        </button>
        <p className="text-[11px] text-gs-muted mt-1.5">PDF, Word, or TXT.</p>

        {documents.length > 0 && (
          <ul className="space-y-1.5 mt-3">
            {documents.map(d => (
              <li key={d.id} className="flex items-center gap-2 px-3 py-2 border border-gs-border rounded-lg bg-gs-card">
                  <FileText size={14} className="text-indigo-500 shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-[13px] text-gs-text">{d.filename}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveDocument(d)}
                    className="text-gs-muted hover:text-red-500 transition-colors shrink-0"
                    aria-label={`Remove ${d.filename}`}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {isProject && (
          <SaveChoice
            value={docSaveToProject}
            onChange={onDocSaveToProjectChange}
            saveLabel="Save to project and use for this simulation"
          />
        )}
      </div>

      {/* Pasted questions */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquareQuote size={15} className="text-indigo-500" />
          <h4 className="text-sm font-bold text-gs-text">Questions or Sponsor Positions</h4>
        </div>
        <p className="text-[12px] text-gs-muted mb-2">
          Paste questions, sponsor positions, or talking points to fold into the simulation.
        </p>
        <textarea
          rows={4}
          value={pastedQuestions}
          onChange={e => onPastedQuestionsChange(e.target.value)}
          placeholder="Paste questions or sponsor positions here…"
          className="w-full px-3 py-2.5 border border-gs-border rounded-lg bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gs-muted resize-none"
        />
        {isProject && (
          <SaveChoice
            value={pastedSaveToProject}
            onChange={onPastedSaveToProjectChange}
            saveLabel="Save pasted content to project"
          />
        )}
        {isProject && projectQuestionnaires.length > 0 && (
          <ul className="space-y-1.5 mt-3">
            {projectQuestionnaires.map(q => (
              <li key={q.id} className="flex items-center gap-2 px-3 py-2 border border-gs-border rounded-lg bg-gs-bg">
                <MessageSquareQuote size={14} className="text-indigo-500 shrink-0" />
                <span className="flex-1 min-w-0 truncate text-[13px] text-gs-text">{q.filename}</span>
                <button
                  type="button"
                  onClick={() => onRemoveProjectQuestionnaire(q)}
                  className="text-gs-muted hover:text-red-500 transition-colors shrink-0"
                  aria-label={`Remove ${q.filename}`}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Manual scenario */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PenLine size={15} className="text-indigo-500" />
          <h4 className="text-sm font-bold text-gs-text">Manual Scenario</h4>
        </div>
        <p className="text-[12px] text-gs-muted mb-2">
          Describe a specific scenario, meeting context, or program detail (optional).
        </p>
        <textarea
          rows={4}
          value={manualScenario}
          onChange={e => onManualScenarioChange(e.target.value)}
          placeholder="Describe the scenario or program context…"
          className="w-full px-3 py-2.5 border border-gs-border rounded-lg bg-gs-bg text-gs-text text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gs-muted resize-none"
        />
      </div>
    </div>
  );
}
