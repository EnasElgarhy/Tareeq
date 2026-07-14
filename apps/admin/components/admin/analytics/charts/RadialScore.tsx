/** Radial progress ring for a 0-100 score — used by the Platform Health panel. */
export function RadialScore({
  value,
  size = 120,
  strokeWidth = 10,
  label,
}: {
  value: number | null;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - pct / 100);
  const color =
    value === null
      ? "var(--adm-line-strong)"
      : pct >= 90
        ? "var(--adm-mint)"
        : pct >= 70
          ? "var(--adm-gold)"
          : "var(--adm-error)";

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--adm-line)"
          strokeWidth={strokeWidth}
        />
        {value !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="adm-display text-2xl leading-none">
          {value === null ? "—" : `${Math.round(value)}%`}
        </span>
        {label && (
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-adm-ink-muted">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
