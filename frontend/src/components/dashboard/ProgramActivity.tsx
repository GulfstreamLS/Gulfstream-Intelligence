import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RecentProjects } from "./RecentProjects";
import { PlatformActivityFeed } from "./PlatformActivityFeed";
import { GlobalCoverage } from "./GlobalCoverage";

export function ProgramActivity() {
  return (
    <section className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gs-text">Program Activity</h2>
        <Link
          href="/dashboard/projects"
          className="flex items-center gap-1 text-sm font-medium text-gs-blue hover:text-gs-deep-blue transition-colors"
        >
          View all projects
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Three-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <RecentProjects />
        </div>
        <div className="card p-5">
          <PlatformActivityFeed />
        </div>
        <div className="card p-5">
          <GlobalCoverage />
        </div>
      </div>
    </section>
  );
}
