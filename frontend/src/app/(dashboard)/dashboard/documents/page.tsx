"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Activity, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

import { assessmentApi }          from "../../../../lib/api";
import type { AnalyzedDocument, GapAssessmentResponse } from "../../../../types";
import { useSubscription }        from "../../../../hooks/useSubscription";
import { UpgradeGate }            from "../../../../components/ui/UpgradeGate";

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

function buildAuthorities(docs: AnalyzedDocument[]): { name: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const d of docs) {
    const key = d.authority?.trim() || "Unknown";
    map[key] = (map[key] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function avgConfidence(docs: AnalyzedDocument[]): number {
  const scored = docs.filter((d) => d.confidence_score != null);
  if (scored.length === 0) return 0;
  const sum = scored.reduce((s, d) => s + (d.confidence_score ?? 0), 0);
  return Math.round(sum / scored.length);
}

export default function DocumentIntelligencePage() {
  const { canAccess, loading: subLoading } = useSubscription();
  const [docs, setDocs]   = useState<AnalyzedDocument[]>([]);
  const [gap, setGap]     = useState<GapAssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [docsRes, gapRes] = await Promise.all([
          assessmentApi.listDocuments(),
          assessmentApi.getGlobalGap(),
        ]);
        setDocs(docsRes);
        setGap(gapRes);
      } catch {
        // keep empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalDocs      = docs.length;
  const totalGaps      = docs.reduce((s, d) => s + d.gap_count, 0);
  const criticalHigh   = (gap?.critical_gaps_count ?? 0) + (gap?.high_priority_count ?? 0);
  const recommendations = gap?.recommendations_count ?? 0;
  const avgConf        = avgConfidence(docs);
  const authorities    = buildAuthorities(docs);
  const recentDocs     = [...docs].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3);

  if (loading || subLoading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[400px]">
        <span className="text-[14px] font-bold text-gs-muted animate-pulse">Loading document intelligence…</span>
      </div>
    );
  }

  return (
    <UpgradeGate feature="document_intelligence" canAccess={canAccess("document_intelligence")}>
    <div className="p-4 md:p-6 lg:p-10 flex flex-col gap-8 max-w-[1440px] mx-auto w-full">

      <DocPageHeader />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <DocStatCard
          title="Documents Analyzed"
          value={String(totalDocs)}
          trend={totalDocs > 0 ? `${totalDocs} total` : "No documents yet"}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <DocStatCard
          title="Key Insights Extracted"
          value={String(gap?.severity_distribution.reduce((s, x) => s + x.count, 0) ?? 0)}
          trend={recommendations > 0 ? `${recommendations} recommendations` : "No insights yet"}
          icon={<Activity className="w-5 h-5" />}
          color="cyan"
        />
        <DocStatCard
          title="Regulatory Gaps Identified"
          value={String(totalGaps)}
          trend={criticalHigh > 0 ? `${criticalHigh} critical/high` : "No gaps yet"}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
        />
        <DocStatCard
          title="Compliance Mentions"
          value={String(recommendations)}
          trend={recommendations > 0 ? "From analysis" : "No data yet"}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="indigo"
        />
        <DocStatCard
          title="Avg. Confidence Score"
          value={avgConf > 0 ? `${avgConf}%` : "—"}
          trend={avgConf > 0 ? (avgConf >= 80 ? "High" : avgConf >= 60 ? "Medium" : "Low") : "No data"}
          color="emerald"
          isProgress
          progressValue={avgConf}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DocCategoriesChart total={totalDocs} authorities={authorities} />
        <InsightsByType severities={gap?.severity_distribution ?? []} />
        <TopRegulatorySources sources={authorities.slice(0, 6)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <RecentDocumentsTable documents={docs} />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <RecentInsights gaps={gap?.top_gaps ?? []} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AIPoweredExtraction recentDocs={recentDocs} />
        <KeyTopicsDetected domains={gap?.domain_readiness ?? []} />
        <RecommendedActions actions={gap?.next_steps ?? []} />
      </div>

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
    </UpgradeGate>
  );
}
