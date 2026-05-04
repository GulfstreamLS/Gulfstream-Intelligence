import { Upload, FileText, ChevronRight } from "lucide-react";

interface RecentUploadItem {
  name: string;
  date: string;
  type: "pdf" | "docx";
}

const RECENT_UPLOADS: RecentUploadItem[] = [
  { name: "CMC Module 3.2.P.3.2 – Drug Product.pdf", date: "May 10, 2025", type: "pdf" },
  { name: "Label – Product XYZ – Draft v2.docx",     date: "May 9, 2025",  type: "docx" },
  { name: "Nonclinical Study Report.pdf",             date: "May 8, 2025",  type: "pdf" },
];

export function AIPoweredExtraction() {
  return (
    <div className="bg-gs-card p-7 rounded-2xl border border-gs-border shadow-card">
      <h3 className="text-[16px] font-bold text-gs-text mb-5">AI-Powered Extraction</h3>

      {/* Drop zone */}
      <div className="border-2 border-dashed border-gs-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 mb-6 hover:border-gs-blue transition-colors cursor-pointer">
        <div className="w-12 h-12 rounded-full bg-gs-bg border border-gs-border flex items-center justify-center text-gs-blue">
          <Upload className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-bold text-gs-text">
            Drag &amp; drop your document here
          </p>
          <p className="text-[13px] text-gs-muted">
            or <span className="text-gs-blue font-bold cursor-pointer hover:underline">browse files</span>
          </p>
        </div>
        <p className="text-[11px] text-gs-muted font-medium">
          Supports PDF, DOCX, PPTX, XLSX (Max 50MB)
        </p>
      </div>

      {/* Recent uploads */}
      <h4 className="text-[13px] font-bold text-gs-text mb-3">Recent Uploads</h4>
      <div className="space-y-2 mb-5">
        {RECENT_UPLOADS.map((file) => (
          <div key={file.name} className="flex items-center gap-3">
            <FileText className={`w-4 h-4 shrink-0 ${file.type === "pdf" ? "text-red-400" : "text-blue-400"}`} />
            <span className="text-[12px] font-semibold text-gs-text flex-1 truncate">{file.name}</span>
            <span className="text-[11px] text-gs-muted font-medium shrink-0">{file.date}</span>
          </div>
        ))}
      </div>

      <button className="text-gs-blue text-[13px] font-bold flex items-center gap-1 hover:underline">
        Go to upload center <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
