import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, Users, FolderPlus } from "lucide-react";

interface ActivityItem {
  icon: React.ElementType;
  iconBg: string;
  action: string;
  subject: string;
  time: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    icon: ClipboardList,
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
    action: "Gap Assessment completed",
    subject: "AAV Gene Therapy Program",
    time: "2h ago",
  },
  {
    icon: FileText,
    iconBg: "bg-red-50 dark:bg-red-950/20",
    action: "Document analyzed",
    subject: "CMC_Summary_v2.pdf",
    time: "5h ago",
  },
  {
    icon: Users,
    iconBg: "bg-purple-50 dark:bg-purple-950/20",
    action: "Simulation session created",
    subject: "Pre-NDA Meeting – FDA",
    time: "1d ago",
  },
  {
    icon: FolderPlus,
    iconBg: "bg-green-50 dark:bg-green-950/20",
    action: "New project created",
    subject: "EU MAA Program",
    time: "2d ago",
  },
];

export function PlatformActivityFeed() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium tracking-wide uppercase text-gs-muted">
        Platform Activity
      </p>

      <div className="flex flex-col gap-3">
        {ACTIVITIES.map((item) => {
          const Icon = item.icon;
          return (
            <div key={`${item.action}-${item.subject}`} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}
              >
                <Icon className="w-4 h-4 text-gs-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gs-text">{item.action}</p>
                <p className="text-xs text-gs-muted truncate">{item.subject}</p>
              </div>
              <span className="text-xs text-gs-muted shrink-0">{item.time}</span>
            </div>
          );
        })}
      </div>

      <Link
        href="/dashboard/history"
        className="flex items-center gap-1 text-sm font-medium text-gs-blue hover:text-gs-deep-blue transition-colors mt-1"
      >
        View all activity
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
