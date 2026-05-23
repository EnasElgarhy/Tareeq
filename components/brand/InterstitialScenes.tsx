import type { SVGProps } from "react";

/**
 * InterstitialScenes — four illustrations for the "Did you know" beats
 * between question stacks, with built-in interactive motion.
 *
 * Each scene animates as the milestone sheet appears: lines draw themselves,
 * stars fade in with a stagger, suns rise, summit stars pulse. Motion
 * is CSS-driven and respects `prefers-reduced-motion: reduce`.
 *
 *   PatternEmergingScene  — stars settle, threads draw to a pulsing anchor
 *   CrossingPathsScene    — three paths draw in, walker pulses, star arrives
 *   DualWaysScene         — sun rises, bridging spark draws across the arches
 *   PeakReachedScene      — summit star pulses, walker beats up the path
 *
 * Same `size`/`tone` props as before; `tone` is accepted for API
 * compatibility but unused (these scenes are designed for the night sheet).
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

/**
 * Shared scene CSS — defined once. The class names are scoped with
 * `scene-*` prefixes so they only apply to the interstitial scenes.
 */
const SCENE_STYLES = `
  @keyframes scene-fade-in {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes scene-draw {
    from { stroke-dashoffset: 1; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes scene-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%      { transform: scale(1.15); opacity: 0.78; }
  }
  @keyframes scene-pulse-soft {
    0%, 100% { transform: scale(1); opacity: 0.55; }
    50%      { transform: scale(1.25); opacity: 0.2; }
  }
  @keyframes scene-rise {
    from { transform: translateY(40px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes scene-walker-step {
    0%, 100% { transform: translate(0, 0); }
    50%      { transform: translate(8px, -6px); }
  }
  @keyframes scene-spark {
    0%, 100% { opacity: 0.6; }
    50%      { opacity: 1; }
  }
  .scene-line {
    stroke-dasharray: 1;
    pathLength: 1;
    animation: scene-draw 1.4s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }
  .scene-line--slow {
    animation-duration: 2s;
  }
  .scene-star {
    transform-origin: center;
    transform-box: fill-box;
    animation: scene-fade-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  .scene-anchor {
    transform-origin: center;
    transform-box: fill-box;
    animation: scene-fade-in 0.6s 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both,
               scene-pulse 3.4s 1.2s ease-in-out infinite;
  }
  .scene-halo {
    transform-origin: center;
    transform-box: fill-box;
    animation: scene-fade-in 1s both,
               scene-pulse-soft 4.6s 1s ease-in-out infinite;
  }
  .scene-rise {
    transform-origin: center bottom;
    animation: scene-rise 1.2s 0.2s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }
  .scene-walker {
    transform-origin: center;
    transform-box: fill-box;
    animation: scene-walker-step 3.6s 1.2s ease-in-out infinite;
  }
  .scene-spark {
    animation: scene-spark 2.4s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .scene-line, .scene-line--slow {
      stroke-dashoffset: 0;
      animation: none;
    }
    .scene-star, .scene-anchor, .scene-halo,
    .scene-rise, .scene-walker, .scene-spark {
      animation: none;
      opacity: 1;
      transform: none;
    }
  }
`;

/** 1 · Pattern emerging — constellation draws itself toward a warm anchor. */
export function PatternEmergingScene({
  size = 180,
  tone: _tone,
  ...rest
}: SceneProps) {
  const stars: Array<[number, number, number]> = [
    [55, 80, 3],
    [195, 60, 2.4],
    [80, 195, 2.6],
    [190, 180, 2.2],
    [40, 150, 2.4],
    [160, 38, 1.6],
    [210, 120, 1.6],
  ];
  return (
    <svg {...sceneProps(size)} {...rest}>
      <defs>
        <WarmGradient id="pat-grad" />
        <WarmRadial id="pat-halo" />
        <style>{SCENE_STYLES}</style>
      </defs>

      <circle
        cx="120"
        cy="120"
        r="80"
        fill="url(#pat-halo)"
        opacity="0.7"
        className="scene-halo"
      />

      {/* Threads — drawn in one by one with a stagger */}
      <g
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="1 5"
        opacity="0.55"
        fill="none"
      >
        <path d="M 55 80 L 120 120" className="scene-line" style={{ animationDelay: "0.05s" }} />
        <path d="M 120 120 L 195 60" className="scene-line" style={{ animationDelay: "0.2s" }} />
        <path d="M 120 120 L 80 195" className="scene-line" style={{ animationDelay: "0.35s" }} />
        <path d="M 120 120 L 190 180" className="scene-line" style={{ animationDelay: "0.5s" }} />
        <path d="M 120 120 L 40 150" className="scene-line" style={{ animationDelay: "0.65s" }} />
      </g>

      {/* Outer cream stars — staggered fade-in */}
      {stars.map(([cx, cy, r], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill={SAND}
          opacity={0.85 - i * 0.06}
          className="scene-star"
          style={{ animationDelay: `${i * 0.08}s` }}
        />
      ))}

      {/* Warm anchor — emerges last and continues pulsing */}
      <circle cx="120" cy="120" r="9" fill="url(#pat-grad)" className="scene-anchor" />
      <circle
        cx="120"
        cy="120"
        r="14"
        fill="none"
        stroke="url(#pat-grad)"
        strokeWidth="1.4"
        opacity="0.7"
        className="scene-anchor"
        style={{ animationDelay: "0.6s" }}
      />
      <circle
        cx="120"
        cy="120"
        r="22"
        fill="none"
        stroke="url(#pat-grad)"
        strokeWidth="0.9"
        opacity="0.35"
        className="scene-anchor"
        style={{ animationDelay: "0.8s" }}
      />

      {/* Pencil stroke — small writing flourish that draws after the rest */}
      <path
        d="M 154 38 L 162 30"
        stroke="url(#pat-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="scene-line scene-line--slow"
        style={{ animationDelay: "0.95s" }}
      />
    </svg>
  );
}

/** 2 · Crossing paths — three paths draw in, the chosen one is warm. */
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
        <style>{SCENE_STYLES}</style>
      </defs>

      <circle
        cx="180"
        cy="55"
        r="48"
        fill="url(#cross-halo)"
        opacity="0.6"
        className="scene-halo"
      />

      {/* Not-taken paths — dashed cream, drawn first */}
      <path
        d="M 35 215 C 60 170, 100 200, 130 150 C 155 110, 100 80, 130 40"
        fill="none"
        stroke={SAND}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2 6"
        opacity="0.45"
        className="scene-line"
        style={{ animationDelay: "0.05s" }}
      />
      <path
        d="M 35 215 C 55 190, 75 165, 80 130 C 85 85, 60 60, 75 30"
        fill="none"
        stroke={SAND}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2 6"
        opacity="0.3"
        className="scene-line"
        style={{ animationDelay: "0.2s" }}
      />

      {/* Chosen path — solid warm gradient, drawn last and slower */}
      <path
        d="M 35 215 C 75 195, 110 175, 130 140 C 150 105, 155 80, 180 55"
        fill="none"
        stroke="url(#cross-grad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        className="scene-line scene-line--slow"
        style={{ animationDelay: "0.4s" }}
      />

      {/* Walker — current position, pulses along its current spot */}
      <g className="scene-walker">
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
      </g>

      {/* Origin marker */}
      <circle
        cx="35"
        cy="215"
        r="3.5"
        fill={SAND}
        opacity="0.85"
        className="scene-star"
        style={{ animationDelay: "0.1s" }}
      />

      {/* Destination star */}
      <path
        d="M 180 38 L 184 51 L 197 53 L 187 61 L 191 75 L 180 67 L 169 75 L 173 61 L 163 53 L 176 51 Z"
        fill="url(#cross-grad)"
        className="scene-anchor"
        style={{ animationDelay: "1.4s" }}
      />

      {/* Faint horizon ticks */}
      {[60, 100, 140, 180].map((y, i) => (
        <line
          key={y}
          x1="15"
          y1={y + 25}
          x2="25"
          y2={y + 25}
          stroke={SAND}
          strokeWidth="0.8"
          opacity="0.18"
          className="scene-star"
          style={{ animationDelay: `${0.2 + i * 0.08}s` }}
        />
      ))}
    </svg>
  );
}

/** 3 · Dual ways — the sun rises and a bridging spark crosses the arches. */
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
        <style>{SCENE_STYLES}</style>
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
        className="scene-line"
      />

      {/* Sun — rises from below the horizon */}
      <g className="scene-rise">
        <circle cx="120" cy="190" r="70" fill="url(#dual-halo)" opacity="0.55" />
        <path
          d="M 80 190 A 40 40 0 0 1 160 190 Z"
          fill="url(#dual-grad)"
          opacity="0.85"
        />
      </g>

      {/* Left arch — concentric rings ("what") */}
      <g>
        <path
          d="M 30 190 L 30 110 A 40 40 0 0 1 110 110 L 110 190"
          fill="none"
          stroke={SAND}
          strokeWidth="1.6"
          opacity="0.9"
          className="scene-line scene-line--slow"
          style={{ animationDelay: "0.15s" }}
        />
        <path
          d="M 42 190 L 42 118 A 28 28 0 0 1 98 118 L 98 190"
          fill="none"
          stroke={SAND}
          strokeWidth="1"
          opacity="0.45"
          className="scene-line"
          style={{ animationDelay: "0.4s" }}
        />
        <circle
          cx="70"
          cy="138"
          r="4"
          fill={SAND}
          opacity="0.85"
          className="scene-star"
          style={{ animationDelay: "0.85s" }}
        />
      </g>

      {/* Right arch — parallel rule ("how") */}
      <g>
        <path
          d="M 130 190 L 130 110 A 40 40 0 0 1 210 110 L 210 190"
          fill="none"
          stroke={SAND}
          strokeWidth="1.6"
          opacity="0.9"
          className="scene-line scene-line--slow"
          style={{ animationDelay: "0.3s" }}
        />
        {[126, 138, 150, 162, 174].map((y, i) => (
          <line
            key={y}
            x1="140"
            y1={y}
            x2="200"
            y2={y}
            stroke={SAND}
            strokeWidth="0.9"
            opacity={0.55 - (y - 126) * 0.005}
            className="scene-line"
            style={{ animationDelay: `${0.55 + i * 0.07}s` }}
          />
        ))}
        <circle
          cx="170"
          cy="138"
          r="4"
          fill="url(#dual-grad)"
          className="scene-anchor"
          style={{ animationDelay: "1s" }}
        />
      </g>

      {/* Bridging spark — they connect at the apex */}
      <path
        d="M 110 110 Q 120 96 130 110"
        fill="none"
        stroke="url(#dual-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="scene-line scene-line--slow"
        style={{ animationDelay: "1.1s" }}
      />
      <circle
        cx="120"
        cy="100"
        r="3"
        fill="url(#dual-grad)"
        className="scene-anchor"
        style={{ animationDelay: "1.5s" }}
      />
    </svg>
  );
}

/** 4 · Peak reached — summit star pulses, walker beats up the dashed path. */
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
        <style>{SCENE_STYLES}</style>
      </defs>

      <circle
        cx="120"
        cy="120"
        r="95"
        fill="url(#peak-halo)"
        opacity="0.75"
        className="scene-halo"
      />

      {/* Distant range — faint, fades in */}
      <path
        d="M 0 200 L 60 150 L 110 175 L 150 145 L 200 180 L 240 160 L 240 240 L 0 240 Z"
        fill={VIOLET_SOFT}
        opacity="0.12"
        className="scene-star"
        style={{ animationDelay: "0.1s" }}
      />

      {/* Primary range — drawn in */}
      <path
        d="M 10 215 L 70 150 L 120 90 L 175 155 L 230 215"
        fill="none"
        stroke={SAND}
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.85"
        className="scene-line scene-line--slow"
        style={{ animationDelay: "0.2s" }}
      />

      {/* Mountain face shading */}
      <path
        d="M 120 90 L 175 155 L 145 155 Z"
        fill={SAND}
        opacity="0.08"
        className="scene-star"
        style={{ animationDelay: "1.4s" }}
      />

      {/* Climbing path — dashed cream, drawn in */}
      <path
        d="M 35 220 C 65 200, 75 180, 95 165 C 110 154, 110 130, 120 105"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="1 6"
        opacity="0.65"
        className="scene-line scene-line--slow"
        style={{ animationDelay: "0.6s" }}
      />

      {/* Starting footprint */}
      <circle
        cx="35"
        cy="220"
        r="3"
        fill={SAND}
        opacity="0.7"
        className="scene-star"
        style={{ animationDelay: "0.55s" }}
      />

      {/* Walker — pulses up the climb */}
      <g className="scene-walker">
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
      </g>

      {/* Summit star — destination, fades in last and pulses */}
      <path
        d="M 120 65 L 124.5 78 L 138 80 L 128 89 L 132 102 L 120 94 L 108 102 L 112 89 L 102 80 L 115.5 78 Z"
        fill="url(#peak-grad)"
        className="scene-anchor"
        style={{ animationDelay: "1.6s" }}
      />
      <circle
        cx="120"
        cy="83"
        r="22"
        fill="none"
        stroke="url(#peak-grad)"
        strokeWidth="0.9"
        opacity="0.35"
        className="scene-anchor"
        style={{ animationDelay: "1.85s" }}
      />
    </svg>
  );
}
