import { ArrowRight, FileText, FlaskConical, Pill, Cpu } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Project {
  icon: React.ElementType;
  name: string;
  type: string;
  regions: string;
  status: "On Track" | "At Risk" | "Needs Attention";
  updated: string;
}

const STATUS_STYLES: Record<Project["status"], string> = {
  "On Track": "bg-green-50 text-gs-green border-green-200 dark:bg-green-950/20 dark:border-green-800",
  "At Risk": "bg-red-50 text-gs-red border-red-200 dark:bg-red-950/20 dark:border-red-800",
  "Needs Attention": "bg-orange-50 text-gs-orange border-orange-200 dark:bg-orange-950/20 dark:border-orange-800",
};

const PROJECTS: Project[] = [
  {
    icon: FileText,
    name: "AAV Gene Therapy Program",
    type: "NDA",
    regions: "Global",
    status: "On Track",
    updated: "Updated 2h ago",
  },
  {
    icon: FlaskConical,
    name: "Oncology IND Program",
    type: "IND",
    regions: "FDA, EMA",
    status: "At Risk",
    updated: "Updated 1d ago",
  },
  {
    icon: Pill,
    name: "Biosimilar BLA Program",
    type: "BLA",
    regions: "Global",
    status: "On Track",
    updated: "Updated 3d ago",
  },
  {
    icon: Cpu,
    name: "Medical Device (Class III)",
    type: "PMA",
    regions: "FDA",
    status: "Needs Attention",
    updated: "Updated 5d ago",
  },
];

export function RecentProjects() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium tracking-wide uppercase text-gs-muted">
        Recent Projects
      </p>

      <div className="flex flex-col gap-1">
        {PROJECTS.map((project) => {
          const Icon = project.icon;
          return (
            <div
              key={project.name}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gs-bg transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-gs-blue" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gs-text truncate">{project.name}</p>
                <p className="text-xs text-gs-muted">
                  {project.type} · {project.regions}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full border",
                    STATUS_STYLES[project.status]
                  )}
                >
                  {project.status}
                </span>
                <span className="text-xs text-gs-muted">{project.updated}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/dashboard/projects"
        className="flex items-center gap-1 text-sm font-medium text-gs-blue hover:text-gs-deep-blue transition-colors mt-1"
      >
        View all projects
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
