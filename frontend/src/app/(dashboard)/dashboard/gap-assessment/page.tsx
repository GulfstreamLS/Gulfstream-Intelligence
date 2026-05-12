"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { GapPageHeader }        from "../../../../components/gap-assessment/GapPageHeader";
import { RegionSelectionPanel } from "../../../../components/gap-assessment/RegionSelectionPanel";
import { GapStatCards }         from "../../../../components/gap-assessment/GapStatCards";
import { ReadinessByDomain }    from "../../../../components/gap-assessment/ReadinessByDomain";
import { GapSeverityDonut }     from "../../../../components/gap-assessment/GapSeverityDonut";
import { GapNextSteps }         from "../../../../components/gap-assessment/GapNextSteps";
import { GapTableSection }      from "../../../../components/gap-assessment/GapTableSection";
import { assessmentApi }        from "../../../../lib/api";
import { useSubscription }      from "../../../../hooks/useSubscription";
import { UpgradeGate }          from "../../../../components/ui/UpgradeGate";
import type { GapAssessmentResponse } from "../../../../types";

export default function GlobalGapAssessmentPage() {
  const { canAccess, loading: subLoading } = useSubscription();
  const [data, setData]           = useState<GapAssessmentResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [authority, setAuthority] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async (auth?: string, docId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await assessmentApi.getGlobalGap(auth, docId);
      setData(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load assessment";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(authority); }, [authority, fetchData]);

  if (subLoading) return null;

  return (
    <UpgradeGate feature="gap_assessment" canAccess={canAccess("gap_assessment")}>
    <div className="min-h-screen bg-gs-bg p-4 md:p-10 font-sans antialiased text-gs-text">
      <div className="max-w-7xl mx-auto">

        <GapPageHeader />

        {error && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-red-700">
                {error.includes("authenticated") || error.includes("401") || error.includes("403")
                  ? "Session expired — please log out and log back in."
                  : error}
              </p>
            </div>
          </div>
        )}

        <RegionSelectionPanel
          onAuthorityChange={setAuthority}
          selectedAuthority={authority}
        />

        <GapStatCards data={data} loading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <ReadinessByDomain data={data?.domain_readiness ?? []} loading={loading} />
          <GapSeverityDonut data={data?.severity_distribution ?? []} loading={loading} />
          <GapNextSteps     data={data?.next_steps ?? []}          loading={loading} />
        </div>

        <GapTableSection data={data?.top_gaps ?? []} loading={loading} />

        <footer className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-[#94A3B8] font-bold text-[11px] uppercase tracking-[0.15em]">
            <ShieldCheck size={18} className="text-[#10B981]" /> All assessments are secure and confidential.
          </div>
          <p className="text-[#CBD5E1] text-[11px] font-medium max-w-[600px] text-center">
            Data is encrypted and stored in compliance with global data protection standards. AI analysis is for informational purposes only.
          </p>
        </footer>

      </div>
    </div>
    </UpgradeGate>
  );
}
