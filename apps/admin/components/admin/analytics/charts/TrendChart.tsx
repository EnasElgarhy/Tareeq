import type { TimeSeriesPoint } from "@/lib/admin/analytics/types";

const VIEW_WIDTH = 600;

function formatDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Larger area/line chart for the Growth section. Fixed viewBox + `w-full` +
 * `preserveAspectRatio="none"` makes it responsive without JS or a chart
 * library — matches the house convention of hand-rolled SVG visualization.
 */
export function TrendChart({
  points,
  height = 160,
  color = "var(--adm-violet)",
  valueSuffix = "",
}: {
  points: TimeSeriesPoint[];
  height?: number;
  color?: string;
  valueSuffix?: string;
}) {
  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-adm-ink-muted"
        style={{ height }}
      >
        No data yet.
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const stepX = points.length > 1 ? VIEW_WIDTH / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = points.length > 1 ? i * stepX : VIEW_WIDTH / 2;
    const y = height - ((p.value - min) / range) * (height - 12) - 6;
    return [x, y] as const;
  });
  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${coords.at(-1)![0]},${height} L${coords[0][0]},${height} Z`;
  const peak = max;

  return (
    <div>
      <div className="mb-1 flex justify-end text-[11px] font-semibold text-adm-ink-muted">
        Peak {peak.toLocaleString()}
        {valueSuffix}
      </div>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height }}
        role="img"
        aria-label={`Trend from ${points[0].value}${valueSuffix} to ${points.at(-1)!.value}${valueSuffix}`}
      >
        <line
          x1={0}
          y1={height - 1}
          x2={VIEW_WIDTH}
          y2={height - 1}
          stroke="var(--adm-line)"
          strokeWidth={1}
        />
        <path d={areaPath} fill={color} opacity={0.1} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-adm-ink-muted">
        <span>{formatDateLabel(points[0].date)}</span>
        <span>{formatDateLabel(points.at(-1)!.date)}</span>
      </div>
    </div>
  );
}
