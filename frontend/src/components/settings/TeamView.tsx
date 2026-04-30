import { UserPlus, Trash2, Eye } from "lucide-react";

interface TeamRowData {
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  isMe?: boolean;
}

const MEMBERS: TeamRowData[] = [
  { name: "Alex Avery",      email: "alex.a@gintelligence.com",   role: "Admin",               status: "Active",   isMe: true },
  { name: "Sarah Chen",      email: "sarah.c@gintelligence.com",  role: "Regulatory Expert",   status: "Active" },
  { name: "Markus Weber",    email: "m.weber@gintelligence.com",  role: "Viewer",              status: "Inactive" },
  { name: "Elena Rodriguez", email: "e.rod@gintelligence.com",    role: "Compliance Officer",  status: "Active" },
];

function TeamRow({ name, email, role, status, isMe }: TeamRowData) {
  return (
    <tr className="hover:bg-gs-bg transition-colors">
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gs-bg rounded-full flex items-center justify-center font-bold text-[12px] text-gs-muted border border-gs-border">
            {name.charAt(0)}
          </div>
          <div>
            <p className="text-[14px] font-bold text-gs-text">
              {name}
              {isMe && (
                <span className="text-[10px] font-black bg-blue-50 text-gs-blue px-1.5 py-0.5 rounded ml-1 uppercase">
                  Me
                </span>
              )}
            </p>
            <p className="text-[12px] text-gs-muted font-medium">{email}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-5 text-[13px] font-bold text-gs-muted">{role}</td>
      <td className="px-8 py-5">
        <span
          className={`flex items-center gap-1.5 text-[12px] font-bold ${
            status === "Active" ? "text-gs-green" : "text-gs-muted"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              status === "Active" ? "bg-gs-green" : "bg-gs-muted"
            }`}
          />
          {status}
        </span>
      </td>
      <td className="px-8 py-5 text-right">
        <div className="flex justify-end gap-4 text-gs-muted">
          <Trash2 className="w-4 h-4 cursor-pointer hover:text-gs-red transition-colors" />
          <Eye className="w-4 h-4 cursor-pointer hover:text-gs-blue transition-colors" />
        </div>
      </td>
    </tr>
  );
}

export function TeamView() {
  return (
    <div className="bg-gs-card rounded-xl border border-gs-border shadow-card overflow-hidden">
      <div className="p-8 border-b border-gs-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-[18px] font-bold text-gs-text mb-1">Team Members</h3>
          <p className="text-[13px] text-gs-muted">Manage your team&apos;s access and roles within the platform.</p>
        </div>
        <button className="btn-primary px-5 py-2.5 flex items-center gap-2 shrink-0">
          <UserPlus className="w-[18px] h-[18px]" /> Invite Member
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-gs-bg text-[11px] font-bold text-gs-muted uppercase tracking-widest border-b border-gs-border">
            <tr>
              <th className="px-8 py-4">Name &amp; Email</th>
              <th className="px-8 py-4">Role</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gs-border">
            {MEMBERS.map((m) => (
              <TeamRow key={m.email} {...m} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
