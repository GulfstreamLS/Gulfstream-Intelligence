import { Search, Download, Clock, History } from "lucide-react";

interface AuditRowData {
  time: string;
  user: string;
  action: string;
  resource: string;
  ip: string;
}

const AUDIT_ROWS: AuditRowData[] = [
  { time: "May 10, 14:23:45", user: "Alex Avery",   action: "Document Uploaded",  resource: "FDA_Q8R2_Guidance.pdf",    ip: "192.168.1.1" },
  { time: "May 10, 11:15:02", user: "Sarah Chen",   action: "Analysis Exported",  resource: "Global_Gap_Report_v2",     ip: "192.168.1.45" },
  { time: "May 09, 16:40:12", user: "System",       action: "MFA Enabled",        resource: "Account: Alex Avery",      ip: "-" },
  { time: "May 09, 09:12:33", user: "Markus Weber", action: "User Login",          resource: "Web Dashboard",            ip: "84.21.10.22" },
  { time: "May 08, 18:22:10", user: "Alex Avery",   action: "Permission Changed",  resource: "User: Markus Weber",       ip: "192.168.1.1" },
];

function AuditRow({ time, user, action, resource, ip }: AuditRowData) {
  return (
    <tr className="hover:bg-gs-bg transition-colors">
      <td className="px-8 py-5 font-bold text-gs-muted">
        <span className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> {time}
        </span>
      </td>
      <td className="px-8 py-5 font-bold text-gs-text">{user}</td>
      <td className="px-8 py-5 font-medium text-gs-blue">{action}</td>
      <td className="px-8 py-5 text-gs-muted font-medium">{resource}</td>
      <td className="px-8 py-5 text-right font-medium text-gs-muted">{ip}</td>
    </tr>
  );
}

export function AuditLogView() {
  return (
    <div className="bg-gs-card rounded-xl border border-gs-border shadow-card overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-gs-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gs-bg">
        <div>
          <h3 className="text-[18px] font-bold text-gs-text mb-1">System Audit Log</h3>
          <p className="text-[13px] text-gs-muted">
            Transparent history of all system changes and document actions.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gs-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search logs..."
              className="h-10 pl-10 pr-4 border border-gs-border rounded-lg text-[13px] w-[200px] bg-gs-card text-gs-text focus:outline-none focus:border-gs-blue"
            />
          </div>
          <button className="h-10 px-4 border border-gs-border rounded-lg bg-gs-card text-[13px] font-bold text-gs-muted flex items-center gap-2 hover:text-gs-text transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gs-bg text-[11px] font-bold text-gs-muted uppercase tracking-widest border-b border-gs-border">
            <tr>
              <th className="px-8 py-4">Timestamp</th>
              <th className="px-8 py-4">User</th>
              <th className="px-8 py-4">Action</th>
              <th className="px-8 py-4">Resource</th>
              <th className="px-8 py-4 text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gs-border text-[13px]">
            {AUDIT_ROWS.map((row) => (
              <AuditRow key={`${row.time}-${row.user}`} {...row} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      <div className="p-4 bg-gs-bg text-center border-t border-gs-border">
        <button className="text-[13px] font-bold text-gs-blue flex items-center justify-center gap-2 w-full hover:underline">
          Load More History <History className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
