import type { SVGProps } from "react";

interface KaiAuraProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * KaiAura — multi-color glowing blob that sits behind the Kai character
 * on the intro screen. Coral + mauve + cyan + lavender blobs offset
 * inside a soft circular field with a strong Gaussian blur, the whole
 * group slowly rotates + breathes via CSS.
 *
 * Vector-only — no rasters. Renders cleanly at any size.
 */
export function KaiAura({ size = 320, ...rest }: KaiAuraProps) {
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
        <radialGradient id="aura-coral" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF6B47" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#FF6B47" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="aura-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8252" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#FF8252" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="aura-mauve" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5B3D8C" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#5B3D8C" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="aura-cyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5BD6E8" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#5BD6E8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="aura-lavender" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B8A5D9" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#B8A5D9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="aura-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD27A" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#FF8252" stopOpacity="0" />
        </radialGradient>

        <filter id="aura-blur">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Rotating + breathing group — applied via the CSS class.
       *  transform-origin matches the circular composition center. */}
      <g
        className="anim-aura-rotate"
        style={{ transformOrigin: "100px 100px" }}
        filter="url(#aura-blur)"
      >
        {/* Coral pocket — top-left */}
        <circle cx="72" cy="76" r="46" fill="url(#aura-coral)" />
        {/* Mauve pocket — top-right */}
        <circle cx="128" cy="78" r="44" fill="url(#aura-mauve)" />
        {/* Lavender pocket — bottom-left */}
        <circle cx="74" cy="128" r="42" fill="url(#aura-lavender)" />
        {/* Cyan pocket — bottom-right */}
        <circle cx="132" cy="130" r="40" fill="url(#aura-cyan)" />
        {/* Warm glow core */}
        <circle cx="100" cy="100" r="30" fill="url(#aura-core)" />
        {/* Coral-glow inner highlight */}
        <circle cx="92" cy="94" r="18" fill="url(#aura-glow)" />
      </g>
    </svg>
  );
}
