import type { ReactNode } from "react";
import { TabNav } from "@/components/admin/analytics/TabNav";
import PageHeader from "@/components/admin/PageHeader";

export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader
        kicker="Admin · Analytics"
        title="How the compass performs"
        description="Health, growth, and what needs attention — across every assessment."
      />
      <div className="space-y-6">
        <TabNav />
        {children}
      </div>
    </>
  );
}
