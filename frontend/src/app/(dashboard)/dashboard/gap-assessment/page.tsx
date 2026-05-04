import { ShieldCheck } from "lucide-react";
import { GapPageHeader }        from "../../../../components/gap-assessment/GapPageHeader";
import { RegionSelectionPanel } from "../../../../components/gap-assessment/RegionSelectionPanel";
import { GapStatCards }         from "../../../../components/gap-assessment/GapStatCards";
import { ReadinessByDomain }    from "../../../../components/gap-assessment/ReadinessByDomain";
import { GapSeverityDonut }     from "../../../../components/gap-assessment/GapSeverityDonut";
import { GapNextSteps }         from "../../../../components/gap-assessment/GapNextSteps";
import { GapTableSection }      from "../../../../components/gap-assessment/GapTableSection";

export default function GlobalGapAssessmentPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans antialiased text-[#1E293B]">
      <div className="max-w-7xl mx-auto">

        <GapPageHeader />
        <RegionSelectionPanel />
        <GapStatCards />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <ReadinessByDomain />
          <GapSeverityDonut />
          <GapNextSteps />
        </div>

        <GapTableSection />

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
  );
}
