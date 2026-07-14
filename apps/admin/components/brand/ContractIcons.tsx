import type { SVGProps } from "react";

/**
 * ContractIcons — the six glyphs of the Contract of Honesty.
 *
 * Each icon is a hairline cream illustration on a 32×32 stage, carrying
 * one warm-gradient signature accent (a spark, a fill, a flourish) so
 * the row reads as a quiet ritual rather than a bullet list. Designed
 * to sit inside `glass-tile` containers on the night surface.
 *
 *   1. VibeIcon     — 4-point spark with gradient core      (Vibe Check)
 *   2. LensIcon     — aperture with gradient pupil          (Focus)
 *   3. HeartIcon    — heart with gradient check             (No wrong answer)
 *   4. PulseIcon    — sine wave with gradient peak          (Intent)
 *   5. ClusterIcon  — constellation, one gradient anchor    (Cluster)
 *   6. PathIcon     — winding trail to gradient star        (Compass)
 *
 * The warm gradient is the same `#FF3D83 → #FF6B3D → #FFA53D` ramp used
 * by `--grad-warm` and the primary CTA — visual continuity between the
 * vow and the button you press after.
 */

interface ContractIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

const SAND = "#F5EEE6";

function WarmGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FF3D83" />
      <stop offset="55%" stopColor="#FF6B3D" />
      <stop offset="100%" stopColor="#FFA53D" />
    </linearGradient>
  );
}

function svgProps(size: number | string) {
  return {
    viewBox: "0 0 32 32",
    width: size,
    height: size,
    "aria-hidden": true as const,
    focusable: false as const,
  };
}

/** 1 · Vibe Check — a 4-point spark, gradient core, cream rays. */
export function VibeIcon({ size = 28, ...rest }: ContractIconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <defs>
        <WarmGradient id="vibe-grad" />
      </defs>
      {/* Outer cream rays */}
      <path
        d="M16 3 L17.4 13.2 L26.5 11.5 L18.9 16 L26.5 20.5 L17.4 18.8 L16 29 L14.6 18.8 L5.5 20.5 L13.1 16 L5.5 11.5 L14.6 13.2 Z"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* Warm core */}
      <circle cx="16" cy="16" r="3.2" fill="url(#vibe-grad)" />
    </svg>
  );
}

/** 2 · Focus — aperture with warm gradient pupil. */
export function LensIcon({ size = 28, ...rest }: ContractIconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <defs>
        <WarmGradient id="lens-grad" />
      </defs>
      {/* Outer ring */}
      <circle
        cx="16"
        cy="16"
        r="10.5"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        opacity="0.85"
      />
      {/* Aperture blades — six tapered slivers */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1="16"
          y1="16"
          x2="16"
          y2="6.2"
          stroke={SAND}
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0.55"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      {/* Warm pupil */}
      <circle cx="16" cy="16" r="3" fill="url(#lens-grad)" />
    </svg>
  );
}

/** 3 · No-Wrong-Answer — heart enclosing a warm gradient check. */
export function HeartIcon({ size = 28, ...rest }: ContractIconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <defs>
        <WarmGradient id="heart-grad" />
      </defs>
      <path
        d="M16 26.5 C 16 26.5, 5 19.8, 5 12.8 C 5 9, 7.8 6, 11.3 6 C 13.4 6, 15.2 7.1, 16 8.8 C 16.8 7.1, 18.6 6, 20.7 6 C 24.2 6, 27 9, 27 12.8 C 27 19.8, 16 26.5, 16 26.5 Z"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity="0.9"
      />
      {/* Warm check */}
      <path
        d="M11.5 15.2 L14.5 18.2 L20.5 12.4"
        fill="none"
        stroke="url(#heart-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 4 · Intent — sine wave with one warm gradient peak. */
export function PulseIcon({ size = 28, ...rest }: ContractIconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <defs>
        <WarmGradient id="pulse-grad" />
      </defs>
      {/* Baseline wave (cream) */}
      <path
        d="M3 16 C 6 16, 7.5 20, 10 20 C 12.5 20, 14 12, 16.5 12 C 19 12, 20.5 20, 23 20 C 25 20, 26.5 16, 29 16"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Warm crescendo arc — the "intent" */}
      <path
        d="M10 20 C 12.5 20, 14 12, 16.5 12 C 19 12, 20.5 20, 23 20"
        fill="none"
        stroke="url(#pulse-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Apex marker */}
      <circle cx="16.5" cy="12" r="1.6" fill="url(#pulse-grad)" />
    </svg>
  );
}

/** 5 · Cluster — five-dot constellation with warm anchor. */
export function ClusterIcon({ size = 28, ...rest }: ContractIconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <defs>
        <WarmGradient id="cluster-grad" />
      </defs>
      {/* Connecting threads */}
      <path
        d="M8 8 L 17 13 L 24 7 M 17 13 L 13 22 M 17 13 L 25 21"
        fill="none"
        stroke={SAND}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Cream stars */}
      <circle cx="8" cy="8" r="1.6" fill={SAND} />
      <circle cx="24" cy="7" r="1.4" fill={SAND} />
      <circle cx="13" cy="22" r="1.5" fill={SAND} />
      <circle cx="25" cy="21" r="1.3" fill={SAND} />
      {/* Warm anchor — the cluster center */}
      <circle
        cx="17"
        cy="13"
        r="2.6"
        fill="url(#cluster-grad)"
      />
      <circle
        cx="17"
        cy="13"
        r="4.6"
        fill="none"
        stroke="url(#cluster-grad)"
        strokeWidth="0.8"
        opacity="0.55"
      />
    </svg>
  );
}

/** 6 · Compass — winding trail leading to a warm star. */
export function PathIcon({ size = 28, ...rest }: ContractIconProps) {
  return (
    <svg {...svgProps(size)} {...rest}>
      <defs>
        <WarmGradient id="path-grad" />
      </defs>
      {/* Dashed trail */}
      <path
        d="M5 25 C 9 24, 10 18, 14 17 C 18 16, 19 11, 23 9"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="0.1 3"
        opacity="0.7"
      />
      {/* Starting footprint */}
      <circle cx="5" cy="25" r="1.6" fill={SAND} opacity="0.85" />
      {/* Warm destination star */}
      <path
        d="M24 4 L25.1 8.2 L29.4 8.6 L26 11.2 L27.2 15.4 L24 12.8 L20.8 15.4 L22 11.2 L18.6 8.6 L22.9 8.2 Z"
        fill="url(#path-grad)"
      />
    </svg>
  );
}
