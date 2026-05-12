'use client';

import React from 'react';
import { 
  FileBarChart, 
  Download, 
  Plus, 
  ChevronRight, 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  FileText, 
  MoreHorizontal, 
  TrendingUp, 
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

// --- Types ---
interface ReportItem {
  id: string;
  name: string;
  type: 'Gap Assessment' | 'Regulatory Intelligence' | 'Submission Readiness' | 'Compliance Audit';
  generatedBy: string;
  date: string;
  size: string;
  status: 'Ready' | 'Processing' | 'Scheduled';
}

const ReportsPage: React.FC = () => {
  const reports: ReportItem[] = [
    { id: '1', name: 'Q2 Global Gap Assessment - IND Biologics', type: 'Gap Assessment', generatedBy: 'Alex Avery', date: 'May 10, 2025', size: '2.4 MB', status: 'Ready' },
    { id: '2', name: 'FDA CMC Compliance Audit - Viral Vector', type: 'Compliance Audit', generatedBy: 'Sarah Chen', date: 'May 09, 2025', size: '1.8 MB', status: 'Ready' },
    { id: '3', name: 'EMA Submission Readiness Summary - mAb', type: 'Submission Readiness', generatedBy: 'System', date: 'May 08, 2025', size: '-', status: 'Processing' },
    { id: '4', name: 'Rare Disease Program Regulatory Intelligence', type: 'Regulatory Intelligence', generatedBy: 'Michael Johnson', date: 'May 07, 2025', size: '4.1 MB', status: 'Ready' },
    { id: '5', name: 'Quarterly Safety Signal Analysis', type: 'Compliance Audit', generatedBy: 'Elena Rodriguez', date: 'May 06, 2025', size: '3.2 MB', status: 'Ready' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans antialiased text-[#1E293B]">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#94A3B8] mb-4">
          <span className="hover:text-blue-600 cursor-pointer transition-colors">Home</span>
          <ChevronRight size={14} className="text-[#CBD5E1]" />
          <span className="text-[#64748B]">Reports</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#0F172A] tracking-tight leading-tight">Reporting & Analytics</h1>
            <p className="text-[#64748B] text-[15px] mt-1">Generate, track, and share comprehensive regulatory intelligence reports.</p>
            <p className="text-[#94A3B8] text-[13px] font-medium">Data-driven insights to power your global submission strategy.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] rounded-lg text-[14px] font-bold shadow-sm hover:bg-slate-50 transition-all">
              <Calendar size={18} className="text-[#2563EB]" /> Schedule Auto-Report
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] text-white rounded-lg text-[14px] font-bold hover:bg-[#1D4ED8] shadow-lg shadow-blue-100 transition-all">
              <Plus size={18} /> Generate New Report
            </button>
          </div>
        </div>

        {/* 1. STATS OVERVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Reports Generated" value="248" sub="+12 this week" color="text-blue-600" icon={<FileBarChart size={24}/>} iconBg="bg-blue-50" />
          <StatCard title="Avg. Readiness Score" value="74.2%" sub="↑ 4.5% vs Q1" color="text-emerald-600" icon={<TrendingUp size={24}/>} iconBg="bg-emerald-50" />
          <StatCard title="Critical Gaps Resolved" value="82" sub="Across 5 programs" color="text-orange-600" icon={<CheckCircle2 size={24}/>} iconBg="bg-orange-50" />
          <StatCard title="Scheduled Tasks" value="12" sub="Next delivery: Mon" color="text-purple-600" icon={<Clock size={24}/>} iconBg="bg-purple-50" />
        </div>

        {/* 2. ANALYTICS ROW */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* Readiness Trend Chart Mockup (8/12) */}
          <div className="col-span-12 lg:col-span-8 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-[16px] font-bold text-[#1E293B]">Global Readiness Progress</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#2563EB]"></div>
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Target</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Actual</span>
                </div>
              </div>
            </div>
            
            {/* SVG Mock Chart */}
            <div className="h-[240px] w-full relative">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                <path d="M0,150 Q200,140 400,100 T800,40" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="5,5" />
                <path d="M0,180 Q100,170 200,140 T400,110 T600,80 T800,65" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                <circle cx="200" cy="140" r="4" fill="#10B981" stroke="white" strokeWidth="2" />
                <circle cx="400" cy="110" r="4" fill="#10B981" stroke="white" strokeWidth="2" />
                <circle cx="800" cy="65" r="4" fill="#10B981" stroke="white" strokeWidth="2" />
              </svg>
              <div className="flex justify-between mt-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest px-2">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
              </div>
            </div>
          </div>

          {/* Distribution Donut (4/12) */}
          <div className="col-span-12 lg:col-span-4 bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col items-center">
            <h3 className="text-[16px] font-bold text-[#1E293B] w-full mb-8">Report Distribution</h3>
            <div className="relative w-40 h-40 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#2563EB" strokeWidth="4" strokeDasharray="40 100" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeDasharray="25 100" strokeDashoffset="-40" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#FBBF24" strokeWidth="4" strokeDasharray="20 100" strokeDashoffset="-65" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="15 100" strokeDashoffset="-85" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[28px] font-bold text-[#0F172A] leading-none">248</span>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase mt-1">Files</span>
              </div>
            </div>
            <div className="w-full space-y-3">
              <LegendItem color="bg-[#2563EB]" label="Gap Assessments" val="40%" />
              <LegendItem color="bg-[#8B5CF6]" label="Intelligence" val="25%" />
              <LegendItem color="bg-[#FBBF24]" label="Audit Reports" val="20%" />
              <LegendItem color="bg-[#10B981]" label="Other" val="15%" />
            </div>
          </div>
        </div>

        {/* 3. RECENT REPORTS TABLE */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-12">
          <div className="px-8 py-6 border-b border-[#F1F5F9] flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-[14px] font-bold text-[#1E293B] uppercase tracking-[0.1em]">Recent Generated Reports</h3>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input type="text" placeholder="Search reports..." className="w-full h-10 pl-10 pr-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-blue-400" />
              </div>
              <button className="flex items-center gap-2 px-4 h-10 bg-white border border-[#E2E8F0] rounded-lg text-[13px] font-bold text-[#64748B]">
                <Filter size={16} /> Filters
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-[#FAFBFF] border-b border-[#F1F5F9]">
                <tr className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em]">
                  <th className="px-8 py-4">Report Name</th>
                  <th className="px-8 py-4">Type</th>
                  <th className="px-8 py-4">Generated By</th>
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">File Size</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-[#2563EB]" />
                        <span className="text-[14px] font-bold text-[#475569] group-hover:text-blue-600">{report.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[12px] font-bold text-[#64748B] uppercase tracking-tight">{report.type}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600">{report.generatedBy[0]}</div>
                        <span className="text-[13px] font-bold text-[#475569]">{report.generatedBy}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[13px] font-bold text-[#94A3B8]">{report.date}</td>
                    <td className="px-8 py-5 text-[13px] font-bold text-[#94A3B8]">{report.size}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                        report.status === 'Ready' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Download size={18} className="text-[#64748B] hover:text-blue-600" />
                         <MoreHorizontal size={18} className="text-[#CBD5E1]" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-5 bg-[#FDFDFD] flex justify-center">
            <button className="text-[#2563EB] text-[13px] font-bold flex items-center gap-1 hover:underline">
              View all generated reports <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 4. TEMPLATE SECTION */}
        <div className="mb-12">
            <h3 className="text-[14px] font-bold text-[#1E293B] uppercase tracking-[0.1em] mb-6">Report Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TemplateCard title="Program Readiness" desc="Detailed view of submission readiness across all domains." />
                <TemplateCard title="Gap Summary" desc="Consolidated view of all high-priority gaps for leadership." />
                <TemplateCard title="Health Authority History" desc="Interaction history and follow-up question analysis." />
            </div>
        </div>

        {/* Footer */}
        <footer className="flex flex-col items-center gap-3 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-2 text-[#94A3B8] font-bold text-[11px] uppercase tracking-[0.15em]">
            <ShieldCheck size={18} className="text-[#10B981]" /> Analytics data is fully encrypted and auditable.
          </div>
          <p className="text-[#CBD5E1] text-[11px] font-medium text-center">Gulfstream Intelligence Reporting Engine v2.4. Reports are generated based on latest platform data sync.</p>
        </footer>
      </div>
    </div>
  );
};

// --- Sub-Components ---

interface StatCardProps { title: string; value: string; sub: string; color: string; icon: React.ReactNode; iconBg: string; }
const StatCard = ({ title, value, sub, color, icon, iconBg }: StatCardProps) => (
  <div className="bg-white p-7 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em]">{title}</span>
      <div className={`p-2.5 rounded-lg ${iconBg} ${color}`}>
        {icon}
      </div>
    </div>
    <h4 className="text-[30px] font-bold text-[#0F172A] leading-none tracking-tight mb-2">{value}</h4>
    <span className={`text-[12px] font-bold ${color}`}>{sub}</span>
  </div>
);

interface LegendItemProps { color: string; label: string; val: string | number; }
const LegendItem = ({ color, label, val }: LegendItemProps) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
      <span className="text-[12px] font-bold text-[#64748B] tracking-tight">{label}</span>
    </div>
    <span className="text-[12px] font-bold text-[#0F172A]">{val}</span>
  </div>
);

interface TemplateCardProps { title: string; desc: string; }
const TemplateCard = ({ title, desc }: TemplateCardProps) => (
    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm hover:border-blue-400 group cursor-pointer transition-all">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Zap size={20} />
        </div>
        <h4 className="text-[15px] font-bold text-[#1E293B] mb-2">{title}</h4>
        <p className="text-[12px] text-[#64748B] leading-relaxed mb-4">{desc}</p>
        <button className="text-[13px] font-bold text-[#2563EB] flex items-center gap-1 group-hover:underline">
            Use Template <ChevronRight size={14} />
        </button>
    </div>
);

export default ReportsPage;