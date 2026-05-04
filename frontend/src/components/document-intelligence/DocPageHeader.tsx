import { Upload, Plus } from "lucide-react";

export function DocPageHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-gs-text leading-tight tracking-tight">
          Document Intelligence
        </h2>
        <p className="text-gs-muted text-[15px] mt-1 font-medium">Extract. Analyze. Understand.</p>
        <p className="text-gs-muted text-[13px] font-medium opacity-70">
          Turn complex regulatory documents into actionable insights.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="h-11 px-5 border border-gs-blue text-gs-blue rounded-button text-sm font-semibold flex items-center gap-2 hover:bg-gs-blue/5 transition-all">
          <Upload className="w-4 h-4" strokeWidth={2.5} />
          Upload Document
        </button>
        <button className="btn-primary h-11 px-5 flex items-center gap-2">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New Analysis
        </button>
      </div>
    </header>
  );
}
