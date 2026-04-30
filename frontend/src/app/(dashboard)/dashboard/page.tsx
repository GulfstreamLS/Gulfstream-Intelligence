import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { QuickSearch } from "@/components/dashboard/QuickSearch";
import { WorkflowChips } from "@/components/dashboard/WorkflowChips";
import { FeatureCardsGrid } from "@/components/dashboard/FeatureCardsGrid";
import { RegulatoryCoreSummary } from "@/components/dashboard/RegulatoryCoreSummary";
import { ProgramActivity } from "@/components/dashboard/ProgramActivity";

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col gap-8 max-w-[1440px] mx-auto w-full">
      {/* Welcome + regulatory core status */}
      <WelcomeHeader userName="Alex" />

      {/* Search */}
      <QuickSearch />

      {/* Workflow quick-launch chips */}
      <WorkflowChips />

      {/* Four feature cards */}
      <FeatureCardsGrid />

      {/* Regulatory Core Summary */}
      <RegulatoryCoreSummary />

      {/* Program Activity: recent projects + feed + map */}
      <ProgramActivity />
    </div>
  );
}
