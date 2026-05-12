"use client";

import { useEffect, useState } from "react";
import { ArrowRight, FileText, FolderOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "../../lib/utils";
import { projectApi } from "../../lib/api";
import type { Project } from "../../types";

const STATUS_STYLES: Record<string, string> = {
  "active":    "bg-green-50 text-gs-green border-green-200 dark:bg-green-950/20 dark:border-green-800",
  "at_risk":   "bg-red-50 text-gs-red border-red-200 dark:bg-red-950/20 dark:border-red-800",
  "on_hold":   "bg-orange-50 text-gs-orange border-orange-200 dark:bg-orange-950/20 dark:border-orange-800",
  "completed": "bg-blue-50 text-gs-blue border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
};

function statusLabel(status: string): string {
  switch (status) {
    case "active":    return "On Track";
    case "at_risk":   return "At Risk";
    case "on_hold":   return "On Hold";
    case "completed": return "Completed";
    default:          return status;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `Updated ${days}d ago`;
  if (hours > 0) return `Updated ${hours}h ago`;
  return `Updated ${mins}m ago`;
}

export function RecentProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    projectApi.list({ page_size: 4 })
      .then((res) => setProjects(res.items ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium tracking-wide uppercase text-gs-muted">
        Recent Projects
      </p>

      {loading ? (
        <div className="flex flex-col gap-2 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-gs-border animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <FolderOpen className="w-8 h-8 text-gs-border" />
          <p className="text-[13px] font-medium text-gs-muted">No projects yet.</p>
          <Link href="/dashboard/projects" className="text-[13px] font-bold text-gs-blue hover:underline">
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gs-bg transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-gs-blue" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gs-text truncate">{project.name}</p>
                <p className="text-xs text-gs-muted">
                  {project.type} · {project.authorities?.join(", ") ?? "Global"}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full border", STATUS_STYLES[project.status] ?? STATUS_STYLES["active"])}>
                  {statusLabel(project.status)}
                </span>
                <span className="text-xs text-gs-muted">{timeAgo(project.updated_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-1 text-sm font-medium text-gs-blue hover:text-gs-deep-blue transition-colors mt-1"
        >
          View all projects
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
