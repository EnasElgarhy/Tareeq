import {
  COMPASS_PILLARS,
  PILLAR_META,
  type CompassPillar,
  type CompassSnapshot,
} from "@/lib/assessment/pillar-progress";

interface CompassProgressProps {
  snapshot: CompassSnapshot;
  /** Pixel size of the compass. Default 88. */
  size?: number;
  /** Optional layout — `compact` shows the compass + a small label;
   *  `display` shows it large with labels around it (used on /start);
   *  `bare` is the compass alone (no label). */
  layout?: "compact" | "display" | "bare";
  /** Surface tone — flips track/letter/center colors for light pages. */
  surface?: "dark" | "light";
}

/**
 * CompassProgress — Tareeq's signature mechanic.
 *
 * Four quadrants for the C-O-R-E pillars. Each fills with coral as the
 * user answers questions in that pillar. The active pillar pulses with
 * a cyan ring. The center holds the percentage; cardinal letters orbit.
 *
 * Replaces the linear progress bar so the user can see *which axes of
 * their compass* are forming — not just "x of 60 done."
 */
export function CompassProgress({
  snapshot,
  size = 88,
  layout = "compact",
  surface = "dark",
}: CompassProgressProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.46;
  const innerR = size * 0.28;
  const isLight = surface === "light";
  const trackColor = isLight ? "#E8E0D4" : "#F5EEE6";
  const trackOpacity = isLight ? 0.9 : 0.18;
  const letterColor = isLight ? "#1B0E3F" : "#F5EEE6";
  const centerFill = isLight ? "#F5EEE6" : "#0F0824";
  const centerFillOpacity = isLight ? 1 : 0.45;
  const centerTextColor = isLight ? "#1B0E3F" : "#F5EEE6";
  const labelMutedColor = isLight ? "rgba(13,27,33,0.55)" : "rgba(245,238,230,0.55)";
  const labelStrongColor = isLight ? "#1B0E3F" : "#F5EEE6";

  // Quadrant order, mapped to compass directions:
  //   C (Curiosities) → top         (-90° → 0°)
  //   O (Operations)  → right       (0°   → 90°)
  //   R (Rewards)     → bottom      (90°  → 180°)
  //   E (Ecosystems)  → left        (180° → 270°)
  const QUADRANT_BASE: Record<CompassPillar, number> = {
    1: -90,
    2: 0,
    3: 90,
    4: 180,
  };

  return (
    <div
      className={
        layout === "display"
          ? "flex flex-col items-center gap-4"
          : layout === "bare"
            ? "inline-flex"
            : "flex items-center gap-3"
      }
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        aria-label={`Compass progress, ${Math.round(snapshot.overall * 100)} percent`}
        role="img"
      >
        <defs>
          <linearGradient id="cmp-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF6B47" />
            <stop offset="100%" stopColor="#FF8252" />
          </linearGradient>
        </defs>

        {/* Quadrants */}
        {COMPASS_PILLARS.map((p) => {
          const base = QUADRANT_BASE[p];
          // Each quadrant sweeps 88° (small gap between segments)
          const start = base + 2;
          const end = base + 88;
          // Filled portion ends at `start + (sweep × progress)`
          const sweep = 86;
          const filled = snapshot.byPillar[p];
          const filledEnd = start + sweep * filled;
          const isActive = snapshot.activePillar === p;

          return (
            <g key={p}>
              {/* Track */}
              <path
                d={annularSector(cx, cy, innerR, outerR, start, end)}
                fill={trackColor}
                fillOpacity={trackOpacity}
              />
              {/* Fill */}
              {filled > 0 ? (
                <path
                  d={annularSector(
                    cx,
                    cy,
                    innerR,
                    outerR,
                    start,
                    filledEnd,
                  )}
                  fill="url(#cmp-fill)"
                />
              ) : null}
              {/* Active pulse ring around this quadrant */}
              {isActive ? (
                <path
                  d={arc(cx, cy, outerR + 2, start, end)}
                  stroke="#5BD6E8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.85"
                >
                  <animate
                    attributeName="opacity"
                    values="0.85;0.35;0.85"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </path>
              ) : null}
            </g>
          );
        })}

        {/* Cardinal letters — C O R E around the compass */}
        {COMPASS_PILLARS.map((p) => {
          const base = QUADRANT_BASE[p];
          const angle = ((base + 45) * Math.PI) / 180;
          const r = (outerR + innerR) / 2;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          const isFilled = snapshot.byPillar[p] > 0;
          const isActive = snapshot.activePillar === p;
          return (
            <text
              key={`l-${p}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.13}
              fontWeight={700}
              fill={letterColor}
              opacity={isActive ? 1 : isFilled ? 0.9 : 0.55}
              fontFamily="var(--font-jakarta), system-ui, sans-serif"
            >
              {PILLAR_META[p].letter}
            </text>
          );
        })}

        {/* Center percentage */}
        <circle
          cx={cx}
          cy={cy}
          r={innerR - 4}
          fill={centerFill}
          fillOpacity={centerFillOpacity}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.2}
          fontWeight={700}
          fill={centerTextColor}
          fontFamily="var(--font-jakarta), system-ui, sans-serif"
        >
          {Math.round(snapshot.overall * 100)}
          <tspan fontSize={size * 0.11} dy={-size * 0.045}>
            %
          </tspan>
        </text>
      </svg>

      {layout === "compact" ? (
        <div className="flex flex-col">
          <p className="text-caption" style={{ color: labelMutedColor }}>
            Your compass
          </p>
          <p
            className="text-body-sm font-semibold"
            style={{ color: labelStrongColor }}
          >
            {snapshot.activePillar
              ? PILLAR_META[snapshot.activePillar].name
              : "Building..."}
          </p>
        </div>
      ) : layout === "display" ? (
        <div
          className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-center text-caption"
          style={{ color: labelMutedColor }}
        >
          {COMPASS_PILLARS.map((p) => (
            <p key={`disp-${p}`}>
              <span
                className="font-semibold"
                style={{ color: labelStrongColor }}
              >
                {PILLAR_META[p].letter}
              </span>{" "}
              {PILLAR_META[p].name}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---- SVG arc helpers ----

function pointOnCircle(
  cx: number,
  cy: number,
  r: number,
  deg: number,
): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r];
}

/** SVG path for the outer arc only (used as the active-quadrant pulse ring). */
function arc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const [x0, y0] = pointOnCircle(cx, cy, r, startDeg);
  const [x1, y1] = pointOnCircle(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

/** SVG path for an annular (donut-segment) sector. */
function annularSector(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number,
): string {
  if (endDeg <= startDeg) return "";
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const [xo0, yo0] = pointOnCircle(cx, cy, rOuter, startDeg);
  const [xo1, yo1] = pointOnCircle(cx, cy, rOuter, endDeg);
  const [xi0, yi0] = pointOnCircle(cx, cy, rInner, endDeg);
  const [xi1, yi1] = pointOnCircle(cx, cy, rInner, startDeg);
  return [
    `M ${xo0} ${yo0}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${xo1} ${yo1}`,
    `L ${xi0} ${yi0}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1}`,
    "Z",
  ].join(" ");
}
