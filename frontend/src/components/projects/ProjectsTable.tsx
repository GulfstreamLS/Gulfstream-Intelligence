import {
  Dna, Beaker, FlaskConical, Pill, Activity,
  MoreHorizontal, ChevronLeft, ChevronRight,
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  type: string;
  indication: string;
  therapeuticArea: string;
  authorities: string[];
  readiness: number;
  status: "On Track" | "At Risk" | "Planning";
  lastUpdated: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const PROJECTS: Project[] = [
  { id: 1, name: "AAV Gene Therapy Program", type: "IND", indication: "Duchenne Muscular Dystrophy",    therapeuticArea: "Rare Disease",       authorities: ["🇺🇸", "🇪🇺", "🇨🇦"], readiness: 72, status: "On Track", lastUpdated: "May 10, 2025\n10:24 AM", icon: <Dna size={18} />,         iconBg: "bg-purple-50",  iconColor: "text-purple-600" },
  { id: 2, name: "mAb Oncology Program",      type: "BLA", indication: "Non-Small Cell Lung Cancer",  therapeuticArea: "Oncology",           authorities: ["🇺🇸", "🇪🇺", "🇯🇵"], readiness: 58, status: "At Risk",  lastUpdated: "May 9, 2025\n3:15 PM",  icon: <Activity size={18} />,    iconBg: "bg-orange-50",  iconColor: "text-orange-600" },
  { id: 3, name: "Viral Vector Vaccine",       type: "IND", indication: "Respiratory Syncytial Virus", therapeuticArea: "Infectious Disease", authorities: ["🇺🇸", "🇪🇺"],          readiness: 81, status: "On Track", lastUpdated: "May 8, 2025\n9:42 AM",  icon: <FlaskConical size={18} />,iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  { id: 4, name: "Oral Small Molecule",        type: "IND", indication: "Type 2 Diabetes",             therapeuticArea: "Metabolic",          authorities: ["🇺🇸", "🇪🇺", "🇨🇳"], readiness: 46, status: "At Risk",  lastUpdated: "May 7, 2025\n11:05 AM", icon: <Pill size={18} />,        iconBg: "bg-blue-50",    iconColor: "text-blue-600" },
  { id: 5, name: "Cell Therapy Program",       type: "IND", indication: "Multiple Sclerosis",          therapeuticArea: "Neurology",          authorities: ["🇺🇸", "🇪🇺"],          readiness: 33, status: "Planning", lastUpdated: "May 6, 2025\n4:20 PM",  icon: <Beaker size={18} />,      iconBg: "bg-amber-50",   iconColor: "text-amber-600" },
];

function StatusBadge({ status }: { status: Project["status"] }) {
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

export function ProjectsTable() {
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
            {PROJECTS.map((project) => (
              <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${project.iconBg} ${project.iconColor} flex items-center justify-center shrink-0`}>
                      {project.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 leading-tight">{project.name}</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">{project.type}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5"><span className="text-[13px] font-medium text-slate-500">{project.indication}</span></td>
                <td className="px-6 py-5"><span className="text-[13px] font-medium text-slate-500">{project.therapeuticArea}</span></td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1.5">
                    {project.authorities.map((flag, idx) => <span key={idx} className="text-base grayscale-[0.2]">{flag}</span>)}
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">+2</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1.5 w-32">
                    <span className="text-[13px] font-bold text-slate-800">{project.readiness}%</span>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${project.readiness > 70 ? "bg-emerald-500" : project.readiness > 40 ? "bg-orange-400" : "bg-red-500"}`}
                        style={{ width: `${project.readiness}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5"><StatusBadge status={project.status} /></td>
                <td className="px-6 py-5">
                  <p className="text-[11px] font-bold text-slate-400 leading-tight text-center whitespace-pre-line">{project.lastUpdated}</p>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="text-slate-300 hover:text-slate-500 transition-colors"><MoreHorizontal size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-white border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-400">Showing 1 to 5 of 15 projects</p>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-300"><ChevronLeft size={16} /></button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-blue-600 bg-blue-50 text-blue-600 text-sm font-bold">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded text-slate-400 text-sm font-bold hover:bg-slate-50">2</button>
          <button className="w-8 h-8 flex items-center justify-center rounded text-slate-400 text-sm font-bold hover:bg-slate-50">3</button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 text-slate-300"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
