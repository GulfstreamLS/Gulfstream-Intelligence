"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PricingTable } from "../../components/billing/PricingTable";

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gs-bg" />}>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

  return (
    <div className="min-h-screen bg-gs-bg py-12">
      <PricingTable initialPlan={plan} />
    </div>
  );
}
