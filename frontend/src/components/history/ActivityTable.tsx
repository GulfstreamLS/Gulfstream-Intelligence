import {
  MessageSquare, FileText, UploadCloud, PlayCircle, ShieldAlert,
  MoreHorizontal, ChevronLeft, ChevronRight,
} from "lucide-react";

interface ActivityItem {
  id: number;
  type: string;
  action: string;
  details: string;
  project: string;
  user: { name: string; initials: string; color: string };
  timestamp: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const ACTIVITIES: ActivityItem[] = [
  { id: 1, type: "Regulatory Chat",    action: "Question asked",       details: "What are the non-clinical expectations for ATMPs?",            project: "AAV Gene Therapy Program", user: { name: "Jennifer Davis",   initials: "JD", color: "bg-blue-600"  }, timestamp: "May 10, 2025\n10:24 AM", icon: <MessageSquare size={16} />, iconBg: "bg-purple-50",  iconColor: "text-purple-600" },
  { id: 2, type: "Document Analyzed",  action: "Processing completed", details: "ICH E6(R2) Good Clinical Practice Guideline",                  project: "Viral Vector Vaccine",     user: { name: "Sarah Kim",        initials: "SK", color: "bg-blue-500"  }, timestamp: "May 10, 2025\n9:58 AM",  icon: <FileText size={16} />,       iconBg: "bg-blue-50",    iconColor: "text-blue-600" },
  { id: 3, type: "File Uploaded",      action: "Document uploaded",    details: "Clinical Protocol – Phase 2 Study.pdf",                       project: "mAb Oncology Program",     user: { name: "Michael Johnson",  initials: "MJ", color: "bg-blue-700"  }, timestamp: "May 10, 2025\n9:32 AM",  icon: <UploadCloud size={16} />,    iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  { id: 4, type: "Simulation Run",     action: "Simulation completed", details: "FDA (U.S.) – IND – Biologic",                                 project: "Cell Therapy Program",     user: { name: "Emily Wong",       initials: "EW", color: "bg-indigo-900" }, timestamp: "May 9, 2025\n4:15 PM",   icon: <PlayCircle size={16} />,     iconBg: "bg-indigo-50",  iconColor: "text-indigo-600" },
  { id: 5, type: "Gap Assessment",     action: "Assessment created",   details: "CMC & Manufacturing Gap Assessment",                          project: "Oral Small Molecule",      user: { name: "Raj Patel",        initials: "RP", color: "bg-blue-800"  }, timestamp: "May 9, 2025\n2:47 PM",   icon: <ShieldAlert size={16} />,    iconBg: "bg-orange-50",  iconColor: "text-orange-600" },
  { id: 6, type: "Document Extracted", action: "Key insights extracted", details: "Reflection Paper on Risk-Based Quality Management",         project: "mAb Oncology Program",     user: { name: "Sarah Kim",        initials: "SK", color: "bg-blue-500"  }, timestamp: "May 9, 2025\n11:03 AM",  icon: <FileText size={16} />,       iconBg: "bg-blue-50",    iconColor: "text-blue-600" },
  { id: 7, type: "Regulatory Chat",    action: "Follow-up question",   details: "Provide examples of lifecycle approaches for process validation.", project: "Viral Vector Vaccine",  user: { name: "Jennifer Davis",   initials: "JD", color: "bg-blue-600"  }, timestamp: "May 9, 2025\n10:21 AM",  icon: <MessageSquare size={16} />, iconBg: "bg-purple-50",  iconColor: "text-purple-600" },
  { id: 8, type: "File Uploaded",      action: "Document uploaded",    details: "CMC Module 3.2.P.3.2 – Drug Product.pdf",                     project: "Cell Therapy Program",     user: { name: "Michael Johnson",  initials: "MJ", color: "bg-blue-700"  }, timestamp: "May 8, 2025\n3:16 PM",   icon: <UploadCloud size={16} />,    iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
];

export function ActivityTable() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-[#FAFBFF] border-b border-slate-100">
            <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-4">Activity</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">Project / Context</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Date &amp; Time</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {ACTIVITIES.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}>
                      {item.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 leading-tight">{item.type}</span>
                      <span className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5">{item.action}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-[300px]">{item.details}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-slate-400">{item.project}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${item.user.color} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm`}>
                      {item.user.initials}
                    </div>
                    <span className="text-sm font-bold text-slate-600 whitespace-nowrap">{item.user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-[12px] font-bold text-slate-500 leading-tight whitespace-pre-line">{item.timestamp}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-300 hover:text-slate-500 transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-white border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">Showing 1 to 10 of 1,248 activities</p>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50"><ChevronLeft size={16} /></button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-blue-600 bg-blue-50 text-blue-600 text-sm font-bold">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded text-slate-500 text-sm font-bold hover:bg-slate-50">2</button>
          <button className="w-8 h-8 flex items-center justify-center rounded text-slate-500 text-sm font-bold hover:bg-slate-50">3</button>
          <span className="text-slate-400 px-1">...</span>
          <button className="w-8 h-8 flex items-center justify-center rounded text-slate-500 text-sm font-bold hover:bg-slate-50">125</button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-slate-50"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
