import { useId } from "react";
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
   *  `display` shows it large with labels around it;
   *  `bare` is the compass alone (no label). */
  layout?: "compact" | "display" | "bare";
  /** Surface tone — flips bezel/letter colors for light pages. */
  surface?: "dark" | "light";
}

/**
 * The CORE axes as the website draws them (ProductJourney's AXES): each
 * pillar owns a cardinal direction and an accent colour.
 */
const PILLAR_AXES: Record<CompassPillar, { angle: number; tone: string }> = {
  1: { angle: -90, tone: "#F4C660" }, // C — north, gold
  2: { angle: 0, tone: "#6FE0C0" }, // O — east, mint
  3: { angle: 90, tone: "#F2A8B3" }, // R — south, blush
  4: { angle: 180, tone: "#9D7FF0" }, // E — west, lilac
};

// Geometry in a 100×100 viewBox.
const C = 50;
const BEZEL_R = 45;
const LETTER_R = 31;
const NEEDLE_REACH = 22;
const QUADRANT_GAP = 10; // degrees left empty between pillar arcs

/**
 * CompassProgress — Tareeq's signature mechanic, drawn as a compass.
 *
 * The bezel is split into four arcs, one per C-O-R-E pillar, each filling
 * in that pillar's colour as questions are answered. The needle swings to
 * the pillar currently being asked; before a scored pillar begins it rests
 * north, dimmed. Overall percentage lives in the accessible label (the
 * chrome shows the question counter alongside).
 */
export function CompassProgress({
  snapshot,
  size = 88,
  layout = "compact",
  surface = "dark",
}: CompassProgressProps) {
  const uid = useId().replace(/:/g, "");
  const isLight = surface === "light";
  const ink = isLight ? "#1B0E3F" : "#F5EEE6";
  const labelMutedColor = isLight
    ? "rgba(13,27,33,0.55)"
    : "rgba(245,238,230,0.55)";

  const active = snapshot.activePillar;
  const needleAngle = active ? PILLAR_AXES[active].angle + 90 : 0;
  const needleTone = active ? PILLAR_AXES[active].tone : ink;
  const needleId = `cmp-needle-${uid}`;
  const percent = Math.round(snapshot.overall * 100);

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
        viewBox="0 0 100 100"
        width={size}
        height={size}
        aria-label={`Compass progress, ${percent} percent`}
        role="img"
      >
        <defs>
          <linearGradient id={needleId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={needleTone} />
            <stop offset="100%" stopColor={needleTone} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Face + minor ticks every 30° (cardinals are the pillar arcs). */}
        <circle
          cx={C}
          cy={C}
          r={BEZEL_R + 3}
          fill={isLight ? "#F5EEE6" : "#0F0824"}
          fillOpacity={isLight ? 1 : 0.55}
        />
        {Array.from({ length: 12 }, (_, i) => i * 30)
          .filter((deg) => deg % 90 !== 0)
          .map((deg) => (
            <line
              key={deg}
              x1={C}
              y1={C - BEZEL_R + 7}
              x2={C}
              y2={C - BEZEL_R + 10}
              stroke={ink}
              strokeOpacity="0.28"
              strokeWidth="1.2"
              strokeLinecap="round"
              transform={`rotate(${deg} ${C} ${C})`}
            />
          ))}

        {/* Pillar arcs: faint track, then the filled portion in its tone. */}
        {COMPASS_PILLARS.map((p) => {
          const { angle, tone } = PILLAR_AXES[p];
          const start = angle - 45 + QUADRANT_GAP / 2;
          const end = angle + 45 - QUADRANT_GAP / 2;
          const filledEnd = start + (end - start) * snapshot.byPillar[p];
          const isActive = active === p;
          return (
            <g key={p}>
              <path
                d={arc(C, C, BEZEL_R, start, end)}
                stroke={ink}
                strokeOpacity="0.14"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              {snapshot.byPillar[p] > 0 ? (
                <path
                  d={arc(C, C, BEZEL_R, start, filledEnd)}
                  stroke={tone}
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  style={
                    isActive
                      ? { filter: `drop-shadow(0 0 3px ${tone})` }
                      : undefined
                  }
                />
              ) : null}
            </g>
          );
        })}

        {/* Cardinal letters, lit in the pillar's tone once it has progress. */}
        {COMPASS_PILLARS.map((p) => {
          const { angle, tone } = PILLAR_AXES[p];
          const [x, y] = pointOnCircle(C, C, LETTER_R, angle);
          const lit = active === p || snapshot.byPillar[p] > 0;
          return (
            <text
              key={`l-${p}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="15"
              fontWeight={800}
              fill={lit ? tone : ink}
              opacity={active === p ? 1 : lit ? 0.85 : 0.4}
              fontFamily="var(--font-jakarta), system-ui, sans-serif"
            >
              {PILLAR_META[p].letter}
            </text>
          );
        })}

        {/* Needle — swings to the active pillar. */}
        <g
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: "50px 50px",
            transition: "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          opacity={active ? 1 : 0.45}
        >
          <path
            d={`M${C} ${C - NEEDLE_REACH} L${C + 5} ${C} L${C - 5} ${C} Z`}
            fill={`url(#${needleId})`}
          />
          <path
            d={`M${C} ${C + NEEDLE_REACH * 0.7} L${C + 5} ${C} L${C - 5} ${C} Z`}
            fill={ink}
            fillOpacity="0.3"
          />
        </g>
        <circle cx={C} cy={C} r="3.4" fill={ink} />
        <circle cx={C} cy={C} r="1.6" fill={needleTone} />
      </svg>

      {layout === "compact" ? (
        <div className="flex flex-col">
          <p className="text-caption" style={{ color: labelMutedColor }}>
            Your compass
          </p>
          <p className="text-body-sm font-semibold" style={{ color: ink }}>
            {active ? PILLAR_META[active].name : "Building..."}
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
                style={{ color: PILLAR_AXES[p].tone }}
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

function arc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  if (endDeg <= startDeg) return "";
  const [x0, y0] = pointOnCircle(cx, cy, r, startDeg);
  const [x1, y1] = pointOnCircle(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}
