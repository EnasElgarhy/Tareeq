import type { SVGProps } from "react";

/**
 * Tareeq illustration set.
 *
 * Three named scenes for the onboarding steps, an ambient star field for
 * decoration. (The mentor character itself lives in `Kai.tsx`.)
 *
 * Conventions:
 *  • viewBox normalized to 160×160 for scenes (square-friendly composition)
 *  • Cream stroke + selective coral fill + cyan accent dot (brand signature)
 *  • Optional `tone` prop swaps the stroke for ink on light surfaces
 */

type SceneProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  /** "cream" for plum surfaces (default), "ink" for cream surfaces */
  tone?: "cream" | "ink";
};

const STROKE_CREAM = "#F5EEE6";
const STROKE_INK = "#0D1B21";
const CORAL = "#FF6B47";
const CORAL_GLOW = "#FF8252";
const CYAN = "#5BD6E8";
const LAVENDER = "#E5DAF5";

function strokeFor(tone: SceneProps["tone"]) {
  return tone === "ink" ? STROKE_INK : STROKE_CREAM;
}

// =====================================================================
// Step 1 — A compass rose with a coral needle and a halo of stars.
//          Pairs with "Take the assessment".
// =====================================================================
export function CompassScene({ size = 160, tone = "cream", ...rest }: SceneProps) {
  const s = strokeFor(tone);
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      {/* radial backdrop glow */}
      <defs>
        <radialGradient id="cmp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8252" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#FF6B47" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FF6B47" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cmp-needle" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={CORAL} />
          <stop offset="100%" stopColor={CORAL_GLOW} />
        </linearGradient>
      </defs>

      <circle cx="80" cy="80" r="70" fill="url(#cmp-glow)">
        {/* breathing glow */}
        <animate
          attributeName="opacity"
          values="0.8;1;0.8"
          dur="4s"
          repeatCount="indefinite"
        />
      </circle>

      {/* ambient stars — each twinkles on its own clock */}
      {[
        [22, 36, 1.6, 3.2, 0],
        [138, 28, 1.2, 4.5, 0.7],
        [142, 110, 1.8, 3.8, 1.4],
        [16, 122, 1.4, 5.2, 0.3],
        [60, 18, 1, 4.0, 2.1],
        [110, 142, 1, 4.7, 1.0],
      ].map(([cx, cy, r, dur, delay], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={s} opacity={0.55}>
          <animate
            attributeName="opacity"
            values="0.55;0.95;0.55"
            dur={`${dur}s`}
            begin={`${delay}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* outer ring */}
      <circle
        cx="80"
        cy="80"
        r="56"
        stroke={s}
        strokeOpacity="0.55"
        strokeWidth="1.5"
        fill="none"
      />
      {/* inner ring */}
      <circle
        cx="80"
        cy="80"
        r="44"
        stroke={s}
        strokeOpacity="0.35"
        strokeWidth="1"
        fill="none"
      />

      {/* cardinal ticks */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 80 + Math.cos(rad) * 50;
        const y1 = 80 + Math.sin(rad) * 50;
        const x2 = 80 + Math.cos(rad) * 56;
        const y2 = 80 + Math.sin(rad) * 56;
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={s}
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}

      {/* compass needle — N/S diamond, rotating slowly around center */}
      <g>
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from="0 80 80"
          to="360 80 80"
          dur="24s"
          repeatCount="indefinite"
        />
        <path d="M80 32 L92 80 L80 88 Z" fill="url(#cmp-needle)" />
        <path d="M80 128 L68 80 L80 72 Z" fill={s} opacity="0.65" />
        {/* signature cyan dot at North — rotates with the needle */}
        <circle cx="80" cy="32" r="3" fill={CYAN} />
        <circle cx="80" cy="32" r="6" fill={CYAN} opacity="0.25">
          <animate
            attributeName="r"
            values="6;9;6"
            dur="2.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.25;0.05;0.25"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* center pin — stays fixed */}
      <circle cx="80" cy="80" r="3" fill={s} />
    </svg>
  );
}

// =====================================================================
// Step 2 — Persona portrait silhouette inside a halo of four pillars
//          (the C-O-R-E quadrants). Pairs with "Meet your Compass".
// =====================================================================
export function PersonaScene({ size = 160, tone = "cream", ...rest }: SceneProps) {
  const s = strokeFor(tone);
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      <defs>
        <radialGradient id="prs-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={CORAL} stopOpacity="0.45" />
          <stop offset="65%" stopColor={CORAL} stopOpacity="0.05" />
          <stop offset="100%" stopColor={CORAL} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="80" cy="80" r="76" fill="url(#prs-glow)">
        <animate
          attributeName="opacity"
          values="0.85;1;0.85"
          dur="5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* four pillar arcs around the silhouette — staggered pulse */}
      {[0, 90, 180, 270].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const fill = [CORAL, CYAN, LAVENDER, CORAL_GLOW][i] ?? CORAL;
        const x = 80 + Math.cos(rad) * 58;
        const y = 80 + Math.sin(rad) * 58;
        const delay = i * 0.5;
        return (
          <g key={deg}>
            <circle cx={x} cy={y} r="4" fill={fill}>
              <animate
                attributeName="r"
                values="4;5;4"
                dur="2.4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={x}
              cy={y}
              r="9"
              stroke={fill}
              strokeOpacity="0.4"
              fill="none"
            >
              <animate
                attributeName="r"
                values="9;14;9"
                dur="2.4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-opacity"
                values="0.4;0.05;0.4"
                dur="2.4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}

      {/* halo ring */}
      <circle
        cx="80"
        cy="80"
        r="42"
        stroke={s}
        strokeOpacity="0.45"
        strokeWidth="1.5"
        fill="none"
      />

      {/* portrait silhouette — head + shoulders */}
      <path
        d="M58 62 c0-14 10-24 22-24 s22 10 22 24 v8 c0 10-9 18-22 18 s-22-8-22-18 z"
        fill={s}
        opacity="0.95"
      />
      <path
        d="M40 124 c5-14 18-22 40-22 s35 8 40 22"
        fill={s}
        opacity="0.85"
      />

      {/* spark above the head — twinkles to draw the eye */}
      <g>
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from="0 80 28"
          to="360 80 28"
          dur="12s"
          repeatCount="indefinite"
        />
        <path
          d="M80 18 L82 26 L90 28 L82 30 L80 38 L78 30 L70 28 L78 26 Z"
          fill={CORAL}
        >
          <animate
            attributeName="opacity"
            values="0.85;1;0.85"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
      </g>
      <circle cx="80" cy="28" r="2" fill={CYAN}>
        <animate
          attributeName="r"
          values="2;3;2"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

// =====================================================================
// Step 3 — Three figures linked by a flowing path. Pairs with
//          "Walk the path with us" — community + knowledge.
// =====================================================================
export function CommunityScene({ size = 160, tone = "cream", ...rest }: SceneProps) {
  const s = strokeFor(tone);
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      <defs>
        <linearGradient id="com-path" x1="0" x2="1" y1="0.5" y2="0.5">
          <stop offset="0%" stopColor={CORAL} />
          <stop offset="50%" stopColor={CYAN} />
          <stop offset="100%" stopColor={CORAL_GLOW} />
        </linearGradient>
        <radialGradient id="com-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={CYAN} stopOpacity="0.3" />
          <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="80" cy="80" r="76" fill="url(#com-glow)">
        <animate
          attributeName="opacity"
          values="0.85;1;0.85"
          dur="4.5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* the connecting path — energy flows from left to right
       *  using stroke-dasharray + animated dashoffset */}
      <path
        d="M25 110 Q60 60 80 95 T135 60"
        stroke="url(#com-path)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="10 12"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-44"
          dur="3.6s"
          repeatCount="indefinite"
        />
      </path>

      {/* three figures along the path */}
      {[
        { x: 30, y: 110, scale: 0.9 },
        { x: 80, y: 95, scale: 1.05 },
        { x: 130, y: 60, scale: 0.9 },
      ].map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y}) scale(${f.scale})`}>
          {/* head */}
          <circle cx="0" cy="-14" r="8" fill={s} />
          {/* body */}
          <path
            d="M-10 14 c0-10 4-16 10-16 s10 6 10 16"
            fill={s}
            opacity="0.92"
          />
          {/* junction dot */}
          <circle cx="0" cy="-14" r="2" fill={CYAN} />
        </g>
      ))}

      {/* spark crowns above each figure — staggered twinkle */}
      {[
        [30, 90, 0],
        [80, 75, 0.8],
        [130, 40, 1.6],
      ].map(([cx, cy, delay], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="1.6" fill={CORAL}>
            <animate
              attributeName="r"
              values="1.6;2.6;1.6"
              dur="2.2s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={cx + 6} cy={cy - 4} r="1" fill={s} opacity={0.7}>
            <animate
              attributeName="opacity"
              values="0.7;0.2;0.7"
              dur="2.2s"
              begin={`${Number(delay) + 0.4}s`}
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={cx - 5} cy={cy - 6} r="0.9" fill={s} opacity={0.5}>
            <animate
              attributeName="opacity"
              values="0.5;0.15;0.5"
              dur="2.2s"
              begin={`${Number(delay) + 0.7}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}
    </svg>
  );
}

// =====================================================================
// Ambient stars — scattered decorative dots, for background atmosphere
// =====================================================================
export function AmbientStars({
  size = 160,
  tone = "cream",
  ...rest
}: SceneProps) {
  const s = strokeFor(tone);
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      {[
        [12, 24, 1.6, 0.7],
        [42, 8, 1, 0.5],
        [78, 36, 1.4, 0.6],
        [130, 18, 1.2, 0.55],
        [148, 64, 1.8, 0.7],
        [22, 80, 1, 0.4],
        [58, 110, 1.3, 0.55],
        [102, 140, 1.6, 0.6],
        [140, 130, 1, 0.45],
        [14, 144, 1.4, 0.5],
        [86, 80, 1.1, 0.5],
        [120, 96, 1.3, 0.5],
      ].map(([cx, cy, r, op], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={s} opacity={op} />
      ))}
      {/* one cyan signature dot */}
      <circle cx="118" cy="40" r="2" fill={CYAN} />
    </svg>
  );
}
