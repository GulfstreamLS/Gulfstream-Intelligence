"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MessageSquare, Plus, ExternalLink, Trash2,
} from "lucide-react";
import { projectApi } from "../../../../../lib/api";
import { ConfirmModal } from "../../../../../components/ui/ConfirmModal";
import type { Conversation, Project } from "../../../../../types";

const AUTHORITY_FLAGS: Record<string, string> = {
  FDA: "🇺🇸", EMA: "🇪🇺", "Health Canada": "🇨🇦", PMDA: "🇯🇵", MHRA: "🇬🇧",
};

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
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([projectApi.get(id), projectApi.getConversations(id)])
      .then(([p, convos]) => { setProject(p); setConversations(convos); })
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
            <div className="flex flex-col items-end gap-2 shrink-0">
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
    </div>
  );
}
