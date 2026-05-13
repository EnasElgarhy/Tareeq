import type { SVGProps } from "react";

/**
 * InterstitialScenes — four illustrations for the "Did you know" beats
 * between question stacks.
 *
 * Designed in the same vocabulary as ContractIcons: hairline cream
 * strokes on the night surface, with one warm-gradient signature flourish
 * per scene (`#FF3D83 → #FF6B3D → #FFA53D`). Each scene tells the body's
 * thesis in a single editorial mark — not a literal illustration.
 *
 *   PatternEmergingScene    — constellation drawing itself  (curiosity has a shape)
 *   CrossingPathsScene      — three paths, one walked        (students switch paths)
 *   DualWaysScene           — two arches, same destination   (how vs what)
 *   PeakReachedScene        — sun cresting the summit        (almost there)
 *
 * The components accept the same `size` and `tone` props as the legacy
 * Illustrations — `tone` is accepted for API compatibility but the
 * palette is fixed to the night-surface variant since these scenes are
 * designed for the dark sheet only.
 */

interface SceneProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  tone?: "cream" | "ink";
}

const SAND = "#F5EEE6";
const VIOLET_SOFT = "#9D7FF0";

function WarmGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FF3D83" />
      <stop offset="55%" stopColor="#FF6B3D" />
      <stop offset="100%" stopColor="#FFA53D" />
    </linearGradient>
  );
}

function WarmRadial({ id }: { id: string }) {
  return (
    <radialGradient id={id} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#FFA53D" stopOpacity="0.95" />
      <stop offset="55%" stopColor="#FF6B3D" stopOpacity="0.55" />
      <stop offset="100%" stopColor="#FF3D83" stopOpacity="0" />
    </radialGradient>
  );
}

function sceneProps(size: number | string) {
  return {
    viewBox: "0 0 240 240",
    width: size,
    height: size,
    "aria-hidden": true as const,
    focusable: false as const,
  };
}

/** Scene 1 — Curiosity has a shape. Constellation forming itself. */
export function PatternEmergingScene({
  size = 180,
  // tone arg accepted for API compatibility
  tone: _tone,
  ...rest
}: SceneProps) {
  return (
    <svg {...sceneProps(size)} {...rest}>
      <defs>
        <WarmGradient id="pat-grad" />
        <WarmRadial id="pat-halo" />
      </defs>

      {/* Warm halo behind the anchor */}
      <circle cx="120" cy="120" r="80" fill="url(#pat-halo)" opacity="0.7" />

      {/* Dashed connecting lines — the pattern being drawn */}
      <path
        d="M 55 80 L 120 120 L 195 60 M 120 120 L 80 195 M 120 120 L 190 180 M 120 120 L 40 150"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="1 5"
        opacity="0.55"
      />

      {/* Outer cream stars */}
      {[
        [55, 80, 3],
        [195, 60, 2.4],
        [80, 195, 2.6],
        [190, 180, 2.2],
        [40, 150, 2.4],
        [160, 38, 1.6],
        [210, 120, 1.6],
      ].map(([cx, cy, r], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill={SAND}
          opacity={0.85 - i * 0.06}
        />
      ))}

      {/* Warm anchor — the center of the pattern */}
      <circle cx="120" cy="120" r="9" fill="url(#pat-grad)" />
      <circle
        cx="120"
        cy="120"
        r="14"
        fill="none"
        stroke="url(#pat-grad)"
        strokeWidth="1.4"
        opacity="0.7"
      />
      <circle
        cx="120"
        cy="120"
        r="22"
        fill="none"
        stroke="url(#pat-grad)"
        strokeWidth="0.9"
        opacity="0.35"
      />

      {/* A tiny "pencil" stroke implying the pattern is being drawn */}
      <path
        d="M 154 38 L 162 30"
        stroke="url(#pat-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Scene 2 — Most students switch paths twice. Three paths, one walked. */
export function CrossingPathsScene({
  size = 180,
  tone: _tone,
  ...rest
}: SceneProps) {
  return (
    <svg {...sceneProps(size)} {...rest}>
      <defs>
        <WarmGradient id="cross-grad" />
        <WarmRadial id="cross-halo" />
      </defs>

      {/* Soft warm pool at the destination */}
      <circle cx="180" cy="55" r="48" fill="url(#cross-halo)" opacity="0.6" />

      {/* Two "not taken" paths — dashed cream */}
      <path
        d="M 35 215 C 60 170, 100 200, 130 150 C 155 110, 100 80, 130 40"
        fill="none"
        stroke={SAND}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2 6"
        opacity="0.45"
      />
      <path
        d="M 35 215 C 55 190, 75 165, 80 130 C 85 85, 60 60, 75 30"
        fill="none"
        stroke={SAND}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2 6"
        opacity="0.3"
      />

      {/* The "chosen" path — solid warm gradient stroke */}
      <path
        d="M 35 215 C 75 195, 110 175, 130 140 C 150 105, 155 80, 180 55"
        fill="none"
        stroke="url(#cross-grad)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Walker — current position on the chosen path */}
      <circle cx="130" cy="140" r="6" fill="url(#cross-grad)" />
      <circle
        cx="130"
        cy="140"
        r="10"
        fill="none"
        stroke="url(#cross-grad)"
        strokeWidth="1.2"
        opacity="0.6"
      />

      {/* Origin marker */}
      <circle cx="35" cy="215" r="3.5" fill={SAND} opacity="0.85" />

      {/* Destination — warm star */}
      <path
        d="M 180 38 L 184 51 L 197 53 L 187 61 L 191 75 L 180 67 L 169 75 L 173 61 L 163 53 L 176 51 Z"
        fill="url(#cross-grad)"
      />

      {/* Faint horizon ticks */}
      {[60, 100, 140, 180].map((y) => (
        <line
          key={y}
          x1="15"
          y1={y + 25}
          x2="25"
          y2={y + 25}
          stroke={SAND}
          strokeWidth="0.8"
          opacity="0.18"
        />
      ))}
    </svg>
  );
}

/** Scene 3 — How matters as much as what. Two arches, same horizon. */
export function DualWaysScene({
  size = 180,
  tone: _tone,
  ...rest
}: SceneProps) {
  return (
    <svg {...sceneProps(size)} {...rest}>
      <defs>
        <WarmGradient id="dual-grad" />
        <WarmRadial id="dual-halo" />
      </defs>

      {/* Horizon line */}
      <line
        x1="20"
        y1="190"
        x2="220"
        y2="190"
        stroke={SAND}
        strokeWidth="1"
        opacity="0.25"
      />

      {/* Warm sun rising between the arches */}
      <circle cx="120" cy="190" r="70" fill="url(#dual-halo)" opacity="0.55" />
      <path
        d="M 80 190 A 40 40 0 0 1 160 190 Z"
        fill="url(#dual-grad)"
        opacity="0.85"
      />

      {/* Left arch — concentric rings ("what") */}
      <g>
        <path
          d="M 30 190 L 30 110 A 40 40 0 0 1 110 110 L 110 190"
          fill="none"
          stroke={SAND}
          strokeWidth="1.6"
          opacity="0.9"
        />
        <path
          d="M 42 190 L 42 118 A 28 28 0 0 1 98 118 L 98 190"
          fill="none"
          stroke={SAND}
          strokeWidth="1"
          opacity="0.45"
        />
        <circle cx="70" cy="138" r="4" fill={SAND} opacity="0.85" />
      </g>

      {/* Right arch — parallel rule ("how") */}
      <g>
        <path
          d="M 130 190 L 130 110 A 40 40 0 0 1 210 110 L 210 190"
          fill="none"
          stroke={SAND}
          strokeWidth="1.6"
          opacity="0.9"
        />
        {/* Stacked rule lines inside */}
        {[126, 138, 150, 162, 174].map((y) => (
          <line
            key={y}
            x1="140"
            y1={y}
            x2="200"
            y2={y}
            stroke={SAND}
            strokeWidth="0.9"
            opacity={0.55 - (y - 126) * 0.005}
          />
        ))}
        <circle cx="170" cy="138" r="4" fill="url(#dual-grad)" />
      </g>

      {/* Bridging spark — they connect at the apex */}
      <path
        d="M 110 110 Q 120 96 130 110"
        fill="none"
        stroke="url(#dual-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="120" cy="100" r="3" fill="url(#dual-grad)" />
    </svg>
  );
}

/** Scene 4 — Almost at your Compass. Sun cresting the summit. */
export function PeakReachedScene({
  size = 180,
  tone: _tone,
  ...rest
}: SceneProps) {
  return (
    <svg {...sceneProps(size)} {...rest}>
      <defs>
        <WarmGradient id="peak-grad" />
        <WarmRadial id="peak-halo" />
      </defs>

      {/* Big warm bloom behind the summit */}
      <circle cx="120" cy="120" r="95" fill="url(#peak-halo)" opacity="0.75" />

      {/* Distant mountain silhouettes — faint */}
      <path
        d="M 0 200 L 60 150 L 110 175 L 150 145 L 200 180 L 240 160 L 240 240 L 0 240 Z"
        fill={VIOLET_SOFT}
        opacity="0.12"
      />

      {/* Primary range — hairline cream */}
      <path
        d="M 10 215 L 70 150 L 120 90 L 175 155 L 230 215"
        fill="none"
        stroke={SAND}
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Inner mountain face — subtle shading hint */}
      <path
        d="M 120 90 L 175 155 L 145 155 Z"
        fill={SAND}
        opacity="0.08"
      />

      {/* Path winding up — dashed cream */}
      <path
        d="M 35 220 C 65 200, 75 180, 95 165 C 110 154, 110 130, 120 105"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="1 6"
        opacity="0.65"
      />

      {/* Starting footprint */}
      <circle cx="35" cy="220" r="3" fill={SAND} opacity="0.7" />

      {/* Walker — near the top of the climb */}
      <circle cx="105" cy="140" r="4.5" fill="url(#peak-grad)" />
      <circle
        cx="105"
        cy="140"
        r="8"
        fill="none"
        stroke="url(#peak-grad)"
        strokeWidth="1"
        opacity="0.55"
      />

      {/* Summit star — destination */}
      <path
        d="M 120 65 L 124.5 78 L 138 80 L 128 89 L 132 102 L 120 94 L 108 102 L 112 89 L 102 80 L 115.5 78 Z"
        fill="url(#peak-grad)"
      />
      <circle
        cx="120"
        cy="83"
        r="22"
        fill="none"
        stroke="url(#peak-grad)"
        strokeWidth="0.9"
        opacity="0.35"
      />
    </svg>
  );
}
