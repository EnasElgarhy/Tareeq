import { ClusterChip } from "@/components/admin/ui/Badge";
import { clusterByCode, type ClusterCode } from "@/lib/admin/clusters";
import type { EngagementLevel, RiskLevel } from "@/lib/admin/users/types";

/**
 * Presentational badges for the Users module. Pure (no hooks), so they render
 * in the server components. Colour carries meaning: mint = healthy/high,
 * gold = attention/medium, rose = high-risk, neutral sand = low/none.
 */

const chip = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold";

const RISK: Record<RiskLevel, { cls: string; dot: string; label: string }> = {
  healthy: { cls: "bg-adm-mint/20 text-adm-mint-ink", dot: "bg-adm-mint-ink", label: "Healthy" },
  needs_attention: { cls: "bg-adm-gold/25 text-adm-gold-ink", dot: "bg-adm-gold-ink", label: "Needs attention" },
  high_risk: { cls: "bg-rose-500/15 text-rose-700", dot: "bg-rose-600", label: "High risk" },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const r = RISK[level];
  return (
    <span className={`${chip} ${r.cls}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
      {r.label}
    </span>
  );
}

const ENGAGEMENT: Record<EngagementLevel, { cls: string; label: string }> = {
  high: { cls: "bg-adm-mint/20 text-adm-mint-ink", label: "High" },
  medium: { cls: "bg-adm-violet/12 text-adm-deep", label: "Medium" },
  low: { cls: "bg-adm-sand text-adm-ink-muted border border-adm-line", label: "Low" },
};

export function EngagementBadge({ level }: { level: EngagementLevel }) {
  return <span className={`${chip} ${ENGAGEMENT[level].cls}`}>{ENGAGEMENT[level].label}</span>;
}

/** Render a CORE cluster as its coloured chip when the code is known, else the
 *  raw string, else an em-dash. Never fabricates a label. */
export function ResultCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-adm-ink-faint">—</span>;
  let known = false;
  try {
    known = Boolean(clusterByCode(value as ClusterCode));
  } catch {
    known = false;
  }
  return known ? (
    <ClusterChip code={value as ClusterCode} showName />
  ) : (
    <span className="text-adm-ink-soft">{value}</span>
  );
}

/** Circular initials avatar (no photos exist in the schema). */
export function InitialsAvatar({ name, size = 32 }: { name: string | null; size?: number }) {
  const initials =
    (name ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "•";
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-adm-violet/12 font-bold text-adm-deep"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

const DAY = 86_400_000;

/** "just now" / "3d ago" / "2mo ago" / "—". Server-rendered relative time. */
export function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  if (diff < DAY) return "today";
  const days = Math.floor(diff / DAY);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
