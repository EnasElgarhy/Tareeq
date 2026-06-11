import PageHeader from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        kicker="Admin · Analytics"
        title="How the compass performs"
        description="Funnels, drop-off, and cluster outcomes across cohorts."
      />
      <EmptyState
        title="Deeper analytics coming soon"
        description="Completion funnels, question-level drop-off, and cluster trends are being wired up to the data warehouse."
      />
    </>
  );
}
