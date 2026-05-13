interface ProgressProps {
  value: number;
  max?: number;
  /** Render on a light background instead of plum */
  onLight?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Progress({
  value,
  max = 1,
  onLight,
  className,
  "aria-label": ariaLabel = "Assessment progress",
}: ProgressProps) {
  const safeMax = Math.max(max, 1);
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const pct = (clamped / safeMax) * 100;

  return (
    <div
      className={`tareeq-progress ${className ?? ""}`}
      data-on-light={onLight || undefined}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="tareeq-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
