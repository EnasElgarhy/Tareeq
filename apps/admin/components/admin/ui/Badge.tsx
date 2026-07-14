import type { ClusterCode } from "@/lib/admin/clusters";
import { clusterByCode } from "@/lib/admin/clusters";

/**
 * Content-version status. Production tracks a single `is_active` boolean, which
 * callers map to "published" (active) vs "draft" (not active). "archived" is
 * kept for forward-compat with the design system but unused today.
 */
export type VersionStatus = "draft" | "published" | "archived";

const badgeBase =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold";

const statusStyles: Record<VersionStatus, { cls: string; label: string }> = {
  draft: { cls: "bg-adm-gold/25 text-adm-gold-ink", label: "Draft" },
  published: { cls: "bg-adm-mint/25 text-adm-mint-ink", label: "Published" },
  archived: {
    cls: "bg-adm-sand text-adm-ink-muted border border-adm-line-strong",
    label: "Archived",
  },
};

export function StatusBadge({ status }: { status: VersionStatus }) {
  const s = statusStyles[status];
  return (
    <span className={`${badgeBase} ${s.cls}`}>
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          status === "published"
            ? "bg-adm-mint-ink"
            : status === "draft"
              ? "bg-adm-gold-ink"
              : "bg-adm-ink-faint"
        }`}
      />
      {s.label}
    </span>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`${badgeBase} bg-adm-violet/10 text-adm-deep ${className}`}>
      {children}
    </span>
  );
}

/** Cluster-colored chip — color always carries the cluster meaning. */
export function ClusterChip({
  code,
  showName = false,
}: {
  code: ClusterCode;
  showName?: boolean;
}) {
  const c = clusterByCode(code);
  return (
    <span
      className={`${badgeBase} border`}
      style={{
        color: `var(${c.cssVar})`,
        borderColor: `color-mix(in srgb, var(${c.cssVar}) 35%, transparent)`,
        backgroundColor: `color-mix(in srgb, var(${c.cssVar}) 9%, transparent)`,
      }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: `var(${c.cssVar})` }}
      />
      {showName ? c.name : c.code}
    </span>
  );
}
