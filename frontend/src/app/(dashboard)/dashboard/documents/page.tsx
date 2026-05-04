import { ShieldAlert } from "lucide-react";
import { Activity, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

import { DocPageHeader }        from "../../../../components/document-intelligence/DocPageHeader";
import { DocStatCard }          from "../../../../components/document-intelligence/DocStatCard";
import { DocCategoriesChart }   from "../../../../components/document-intelligence/DocCategoriesChart";
import { InsightsByType }       from "../../../../components/document-intelligence/InsightsByType";
import { TopRegulatorySources } from "../../../../components/document-intelligence/TopRegulatorySources";
import { RecentDocumentsTable } from "../../../../components/document-intelligence/RecentDocumentsTable";
import { RecentInsights }       from "../../../../components/document-intelligence/RecentInsights";
import { AIPoweredExtraction }  from "../../../../components/document-intelligence/AIPoweredExtraction";
import { KeyTopicsDetected }    from "../../../../components/document-intelligence/KeyTopicsDetected";
import { RecommendedActions }   from "../../../../components/document-intelligence/RecommendedActions";

export default function DocumentIntelligencePage() {
  return (
    <div className="p-4 md:p-6 lg:p-10 flex flex-col gap-8 max-w-[1440px] mx-auto w-full">

      {/* Header */}
      <DocPageHeader />

      {/* 5-column stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <DocStatCard
          title="Documents Analyzed"
          value="128"
          trend="↑ 18 this month"
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <DocStatCard
          title="Key Insights Extracted"
          value="642"
          trend="↑ 96 this month"
          icon={<Activity className="w-5 h-5" />}
          color="cyan"
        />
        <DocStatCard
          title="Regulatory Gaps Identified"
          value="86"
          trend="↑ 12 vs last month"
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
        />
        <DocStatCard
          title="Compliance Mentions"
          value="1,248"
          trend="↑ 210 this month"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="indigo"
        />
        <DocStatCard
          title="Avg. Confidence Score"
          value="92%"
          trend="High"
          color="emerald"
          isProgress
        />
      </div>

      {/* Charts row: Document Categories | Insights by Type | Top Regulatory Sources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DocCategoriesChart />
        <InsightsByType />
        <TopRegulatorySources />
      </div>

      {/* Documents + Insights row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RecentDocumentsTable />
        </div>
        <div className="lg:col-span-4">
          <RecentInsights />
        </div>
      </div>

      {/* Bottom row: AI Extraction | Key Topics | Recommended Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AIPoweredExtraction />
        <KeyTopicsDetected />
        <RecommendedActions />
      </div>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-center text-[11px] font-bold text-gs-muted gap-1">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-gs-green" />
          All documents are encrypted and stored securely.
        </div>
        <p className="font-medium">
          AI analysis is for informational purposes and does not replace regulatory judgment.
        </p>
      </footer>
    </div>
  );
}
