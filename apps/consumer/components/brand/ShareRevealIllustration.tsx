/**
 * ShareRevealIllustration — the centerpiece of the /share/[token] intro
 * reveal. A bespoke compass-star burst (no Kai): a warm-gradient eight-point
 * compass rose pulsing at the center, ringed by alternating gold/violet
 * sparkle tokens that twinkle on a stagger, a slow-drifting dashed ring, and
 * soft radiating light behind it all — visualizing "a direction, just
 * revealed to you" rather than any specific product mascot.
 *
 * Same hand-authored SVG + CSS-keyframe idiom as ResultIcons/ContractIcons/
 * QuestionKaiScene elsewhere in this codebase, and reuses the exact
 * compass-rose path proportions from CompassSignalPanel's ResultCompass so
 * it reads as the same visual family, just a standalone hero moment instead
 * of a small background accent.
 */

const BURST_ANGLES = Array.from({ length: 12 }, (_, i) => i * 30);
const SPARKLE_ANGLES = Array.from({ length: 8 }, (_, i) => i * 45);

/** Math.cos/sin can differ in their last decimal place between the server's
 *  Node runtime and the browser's V8 build — rounding before it hits JSX
 *  avoids a hydration mismatch over a difference no one could ever see. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function ShareRevealIllustration({ size = 200 }: { size?: number | string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="share-reveal-warm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF3D83" />
          <stop offset="55%" stopColor="#FF6B3D" />
          <stop offset="100%" stopColor="#FFA53D" />
        </linearGradient>
        <radialGradient id="share-reveal-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFA53D" stopOpacity="0.5" />
          <stop offset="65%" stopColor="#FF6B3D" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FF6B3D" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="100" r="92" fill="url(#share-reveal-glow)" />

      <g
        className="share-reveal-burst"
        stroke="url(#share-reveal-warm)"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        {BURST_ANGLES.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = round2(100 + Math.cos(rad) * 48);
          const y1 = round2(100 + Math.sin(rad) * 48);
          const x2 = round2(100 + Math.cos(rad) * 94);
          const y2 = round2(100 + Math.sin(rad) * 94);
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>

      <circle
        className="result-compass-spin"
        cx="100"
        cy="100"
        r="86"
        fill="none"
        stroke="rgba(245,238,230,0.22)"
        strokeDasharray="2 11"
        strokeWidth="1.5"
      />

      {SPARKLE_ANGLES.map((angle, index) => {
        const rad = (angle * Math.PI) / 180;
        const x = round2(100 + Math.cos(rad) * 66);
        const y = round2(100 + Math.sin(rad) * 66);
        const isViolet = index % 2 === 1;
        return (
          <g
            key={angle}
            className="share-reveal-sparkle"
            style={{ animationDelay: `${index * 0.28}s` }}
            transform={`translate(${x} ${y})`}
          >
            <path
              d="M0 -5 L1.4 -1.4 L5 0 L1.4 1.4 L0 5 L-1.4 1.4 L-5 0 L-1.4 -1.4 Z"
              fill={isViolet ? "#9D7FF0" : "#F4C660"}
            />
          </g>
        );
      })}

      <g className="share-reveal-star">
        <path
          d="M100 34 L112 92 L166 100 L112 108 L100 166 L88 108 L34 100 L88 92 Z"
          fill="url(#share-reveal-warm)"
        />
        <circle cx="100" cy="100" r="9" fill="#0F0824" />
        <circle cx="100" cy="100" r="4" fill="#FFD98A" />
      </g>
    </svg>
  );
}
