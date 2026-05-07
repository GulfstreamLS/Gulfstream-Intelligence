"use client";

import { useState } from "react";
import {
  Dna, Beaker, FlaskConical, Pill, Activity,
  MoreHorizontal, ChevronLeft, ChevronRight, MessageSquare, ExternalLink, Trash2,
} from "lucide-react";
import type { Project, ProjectStatus } from "../../types";

const AUTHORITY_FLAGS: Record<string, string> = {
  FDA: "🇺🇸", EMA: "🇪🇺", "Health Canada": "🇨🇦", PMDA: "🇯🇵", MHRA: "🇬🇧",
};

const ICONS = [Dna, Activity, FlaskConical, Pill, Beaker];
const ICON_STYLES = [
  { bg: "bg-purple-50", color: "text-purple-600" },
  { bg: "bg-orange-50", color: "text-orange-600" },
  { bg: "bg-emerald-50", color: "text-emerald-600" },
  { bg: "bg-blue-50", color: "text-blue-600" },
  { bg: "bg-amber-50", color: "text-amber-600" },
];

function iconForProject(idx: number) {
  const Icon = ICONS[idx % ICONS.length];
  const style = ICON_STYLES[idx % ICON_STYLES.length];
  return { Icon, ...style };
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const styles =
    status === "On Track" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
    status === "At Risk"  ? "bg-orange-50 text-orange-600 border-orange-100" :
                            "bg-purple-50 text-purple-600 border-purple-100";
  const dot =
    status === "On Track" ? "bg-emerald-500" :
    status === "At Risk"  ? "bg-orange-500"  : "bg-purple-500";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${styles}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-6 py-5">
          <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

type MenuState = { id: string; top: number; right: number } | null;

export function ProjectsTable({
  projects,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onStartChat,
  onViewDetail,
  onDelete,
}: {
  projects: Project[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onStartChat: (id: string) => void;
  onViewDetail: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menu, setMenu] = useState<MenuState>(null);

  function openMenu(e: React.MouseEvent<HTMLButtonElement>, id: string) {
    if (menu?.id === id) { setMenu(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({ id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-8">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-[#FAFBFF] border-b border-slate-100">
            <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">Project Name</th>
              <th className="px-6 py-4">Indication</th>
              <th className="px-6 py-4">Therapeutic Area</th>
              <th className="px-6 py-4">Health Authorities</th>
              <th className="px-6 py-4">Overall Readiness</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Last Updated</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : projects.length === 0
              ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-400 text-sm font-medium">
                    No projects found. Create your first project to get started.
                  </td>
                </tr>
              )
              : projects.map((project, idx) => {
                const { Icon, bg, color } = iconForProject(idx);
                const authorities = project.authorities ?? [];
                const shownFlags = authorities.slice(0, 3);
                const extra = authorities.length - 3;
                const date = new Date(project.updated_at);
                const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return (
                  <tr
                    key={project.id}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => onViewDetail(project.id)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 leading-tight">{project.name}</span>
                          <span className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">{project.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5"><span className="text-[13px] font-medium text-slate-500">{project.indication ?? "—"}</span></td>
                    <td className="px-6 py-5"><span className="text-[13px] font-medium text-slate-500">{project.therapeutic_area ?? "—"}</span></td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5">
                        {shownFlags.map((auth, i) => (
                          <span key={i} className="text-base grayscale-[0.2]">{AUTHORITY_FLAGS[auth] ?? auth}</span>
                        ))}
                        {extra > 0 && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">+{extra}</span>
                        )}
                        {authorities.length === 0 && <span className="text-[13px] text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5 w-32">
                        <span className="text-[13px] font-bold text-slate-800">{project.readiness_score}%</span>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${project.readiness_score > 70 ? "bg-emerald-500" : project.readiness_score > 40 ? "bg-orange-400" : "bg-red-500"}`}
                            style={{ width: `${project.readiness_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5"><StatusBadge status={project.status} /></td>
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-bold text-slate-400 leading-tight text-center">{dateStr}<br />{timeStr}</p>
                    </td>
                    <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="text-slate-300 hover:text-slate-500 transition-colors"
                        onClick={(e) => openMenu(e, project.id)}
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-white border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-400">
          {total === 0 ? "No projects" : `Showing ${start} to ${end} of ${total} projects`}
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-300 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold ${
                p === page
                  ? "border border-blue-600 bg-blue-50 text-blue-600"
                  : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-300 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Fixed-position dropdown — escapes overflow-x-auto clipping */}
      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-white border border-slate-100 shadow-xl rounded-lg py-1 w-44"
            style={{ top: menu.top, right: menu.right }}
          >
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => { setMenu(null); onViewDetail(menu.id); }}
            >
              <ExternalLink size={14} /> View Details
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => { setMenu(null); onStartChat(menu.id); }}
            >
              <MessageSquare size={14} /> Start Chat
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => { setMenu(null); onDelete(menu.id); }}
            >
              <Trash2 size={14} /> Delete Project
            </button>
          </div>
        </>
      )}
    </div>
  );
}
