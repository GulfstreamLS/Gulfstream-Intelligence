"use client";

import { PricingTable } from "../../../../components/billing/PricingTable";

export default function SubscriptionPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gs-text">Subscription Management</h1>
        <p className="text-sm text-gs-muted mt-1">Manage your plan and billing information.</p>
      </div>

      <div className="bg-gs-card border border-gs-border rounded-2xl overflow-hidden">
        <PricingTable showDashboardLink={false} />
      </div>
    </div>
  );
}
