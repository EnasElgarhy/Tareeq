import type { SVGProps } from "react";

/**
 * KaiAuraV2 — v2 redesign aura.
 *
 * Mystical, painterly feel — Moonly-inspired. Aurora-style multi-color
 * cloud with deeper saturation than v1. Heavy Gaussian blur + grain
 * filter for a textured "stardust" quality. Slow internal rotation
 * (via CSS class) + breathing.
 */
export function KaiAuraV2({
  size = 320,
  ...rest
}: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      <defs>
        <radialGradient id="auraV2-violet" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9D7FF0" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#9D7FF0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="auraV2-gold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4C660" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#F4C660" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="auraV2-blush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F2A8B3" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#F2A8B3" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="auraV2-mint" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6FE0C0" stopOpacity="0.75" />
          <stop offset="70%" stopColor="#6FE0C0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="auraV2-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE7A8" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#F2A8B3" stopOpacity="0" />
        </radialGradient>

        <filter id="auraV2-blur">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <g
        className="anim-aura-rotate"
        style={{ transformOrigin: "100px 100px" }}
        filter="url(#auraV2-blur)"
      >
        {/* Aurora pockets — asymmetric placement for painterly feel */}
        <circle cx="68" cy="68" r="50" fill="url(#auraV2-violet)" />
        <circle cx="138" cy="74" r="42" fill="url(#auraV2-blush)" />
        <circle cx="76" cy="138" r="44" fill="url(#auraV2-mint)" />
        <circle cx="134" cy="134" r="48" fill="url(#auraV2-gold)" />
        <circle cx="100" cy="100" r="32" fill="url(#auraV2-core)" />
        <circle cx="92" cy="94" r="22" fill="url(#auraV2-violet)" />
      </g>
    </svg>
  );
}
