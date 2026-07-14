import type { SVGProps } from "react";

/**
 * StepIcons — illustrated icon tiles for the /start onboarding ladder.
 *
 * Each is a 40px rounded-square in a distinct brand color, with cream
 * line illustration inside that tells a tiny story. Designed bigger and
 * more dimensional than the monoline utility icons in `icons.tsx` so
 * they carry the visual weight the step rhythm needs.
 *
 *   Step 1 · AssessIcon    — chat bubble + check  · coral
 *   Step 2 · DiscoverIcon  — compass star         · lavender
 *   Step 3 · GrowIcon      — three linked figures · cyan
 *
 * Each carries a small signature dot in cyan (or cream on cyan tiles)
 * for brand continuity with the rest of the icon system.
 */

interface StepIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

const CREAM = "#F5EEE6";
const PLUM = "#1B0E3F";
const PLUM_DEEP = "#0F0824";
const CYAN = "#5BD6E8";

export function AssessIcon({ size = 40, ...rest }: StepIconProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      <defs>
        <linearGradient id="step-coral" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF8252" />
          <stop offset="100%" stopColor="#FF6B47" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#step-coral)" />
      {/* Inner highlight */}
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="39"
        rx="11.5"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.16"
      />
      {/* Chat bubble */}
      <path
        d="M9 14 C9 12.3 10.3 11 12 11 H28 C29.7 11 31 12.3 31 14 V22 C31 23.7 29.7 25 28 25 H18 L13 28.5 V25 C10.5 25 9 23.5 9 22 Z"
        fill="none"
        stroke={CREAM}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Check inside */}
      <path
        d="M14 18.5 L17.5 22 L24 15"
        fill="none"
        stroke={CREAM}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cyan signature dot */}
      <circle cx="32.5" cy="7.5" r="2" fill={CYAN} />
      <circle cx="32.5" cy="7.5" r="3.5" fill={CYAN} opacity="0.3" />
    </svg>
  );
}

export function DiscoverIcon({ size = 40, ...rest }: StepIconProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      <defs>
        <linearGradient id="step-lavender" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E5DAF5" />
          <stop offset="100%" stopColor="#B8A5D9" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#step-lavender)" />
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="39"
        rx="11.5"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.25"
      />
      {/* Four-point compass star */}
      <path
        d="M20 7 L22 18 L33 20 L22 22 L20 33 L18 22 L7 20 L18 18 Z"
        fill={CREAM}
        stroke={PLUM}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Center pin */}
      <circle cx="20" cy="20" r="1.8" fill={PLUM_DEEP} />
      {/* Cyan signature dot */}
      <circle cx="32.5" cy="7.5" r="2" fill={CYAN} />
      <circle cx="32.5" cy="7.5" r="3.5" fill={CYAN} opacity="0.3" />
    </svg>
  );
}

export function GrowIcon({ size = 40, ...rest }: StepIconProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      focusable={false}
      {...rest}
    >
      <defs>
        <linearGradient id="step-cyan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7CE5F2" />
          <stop offset="100%" stopColor="#5BD6E8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#step-cyan)" />
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="39"
        rx="11.5"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.32"
      />
      {/* Three small figures linked by a path */}
      <g fill={PLUM_DEEP}>
        <circle cx="11" cy="14" r="3" />
        <circle cx="20" cy="12" r="3" />
        <circle cx="29" cy="14" r="3" />
      </g>
      <g
        fill="none"
        stroke={PLUM_DEEP}
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M7 27 c1-4 3-6 4-6" />
        <path d="M11 21 c2 0 3 1 4 4" />
        <path d="M16 25 c1-4 3-6 4-6" />
        <path d="M20 19 c2 0 3 1 4 4" />
        <path d="M25 23 c1-4 3-6 4-6" />
        <path d="M29 17 c2 0 3 1 4 6" />
      </g>
      {/* Cream signature dot (cyan-on-cyan wouldn't show) */}
      <circle cx="32.5" cy="7.5" r="2" fill={CREAM} />
      <circle cx="32.5" cy="7.5" r="3.5" fill={CREAM} opacity="0.4" />
    </svg>
  );
}
