import { Briefcase, Globe, Sparkles, Target } from "lucide-react";
import { BreakdownBars } from "@/components/admin/analytics/BreakdownBars";
import { Card } from "@/components/admin/ui/Card";
import { clusterByCode, type ClusterCode } from "@/lib/admin/clusters";
import { paletteColor } from "@/lib/admin/analytics/labels";
import type { BreakdownEntry, ResultsDistribution } from "@/lib/admin/analytics/types";

const ICON_PROPS = { size: 15, strokeWidth: 2.25 } as const;

function clusterColor(entry: BreakdownEntry): string {
  // "unknown" isn't a real cluster code — clusterByCode would silently fall
  // back to the first cluster's color, falsely implying that cluster.
  if (entry.key === "unknown") return "var(--adm-ink-faint)";
  return clusterByCode(entry.key as ClusterCode).hex;
}

export function ResultsDistributionSection({
  distribution,
  totalRows,
}: {
  distribution: ResultsDistribution;
  totalRows: number;
}) {
  return (
    <section aria-label="Results distribution" className="space-y-3">
      <p className="text-xs text-adm-ink-muted">
        Based on {distribution.coreRowCount.toLocaleString()} of{" "}
        {totalRows.toLocaleString()} matched assessments with a CORE-shaped
        result (cluster, archetype, driver, ecosystem). Custom-assessment
        results use named profiles and aren&apos;t broken out here yet.
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="adm-fade-up p-5">
          <BreakdownBars
            title="Primary career cluster"
            icon={<Briefcase className="text-adm-ink-muted" {...ICON_PROPS} />}
            entries={distribution.byCluster}
            colorFor={clusterColor}
          />
        </Card>
        <Card className="adm-fade-up p-5">
          <BreakdownBars
            title="Operational archetype"
            icon={<Sparkles className="text-adm-ink-muted" {...ICON_PROPS} />}
            entries={distribution.byArchetype}
            colorFor={(_, i) => paletteColor(i)}
          />
        </Card>
        <Card className="adm-fade-up p-5">
          <BreakdownBars
            title="Primary reward driver"
            icon={<Target className="text-adm-ink-muted" {...ICON_PROPS} />}
            entries={distribution.byPrimaryDriver}
            colorFor={(_, i) => paletteColor(i)}
          />
        </Card>
        <Card className="adm-fade-up p-5">
          <BreakdownBars
            title="Ecosystem fit"
            icon={<Globe className="text-adm-ink-muted" {...ICON_PROPS} />}
            entries={distribution.byEcosystemFit}
            colorFor={(_, i) => paletteColor(i)}
          />
        </Card>
      </div>
    </section>
  );
}
