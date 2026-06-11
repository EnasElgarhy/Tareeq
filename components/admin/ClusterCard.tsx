import type { Cluster } from "@/lib/admin/clusters";
import { Card } from "@/components/admin/ui/Card";

/** Category card for one of the 8 career clusters — color carries meaning. */
export function ClusterCard({
  cluster,
  questionCount,
}: {
  cluster: Cluster;
  questionCount: number;
}) {
  return (
    <Card interactive className="overflow-hidden">
      {/* cluster color rule */}
      <span
        aria-hidden="true"
        className="block h-1.5 w-full"
        style={{ backgroundColor: `var(${cluster.cssVar})` }}
      />
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ color: `var(${cluster.cssVar})` }}
          >
            {cluster.code}
          </p>
          <p className="adm-display text-lg leading-none">{questionCount}</p>
        </div>
        <p className="mt-1.5 text-sm font-bold text-adm-ink">{cluster.name}</p>
        <p className="text-xs text-adm-ink-muted" lang="ar" dir="rtl">
          {cluster.nameAr}
        </p>
      </div>
    </Card>
  );
}
