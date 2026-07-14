import { Card } from "@/components/admin/ui/Card";

/**
 * Generic skeleton shown while any analytics tab's data loads — PageHeader
 * and TabNav live in layout.tsx and render immediately, so this only needs
 * to stand in for the page-specific content below them.
 */
export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="adm-skeleton h-10 w-full" />
      </Card>
      <Card className="p-5">
        <div className="adm-skeleton h-4 w-32" />
        <div className="adm-skeleton mt-4 h-40 w-full" />
      </Card>
      <Card className="p-5">
        <div className="adm-skeleton h-4 w-24" />
        <div className="adm-skeleton mt-4 h-24 w-full" />
      </Card>
    </div>
  );
}
