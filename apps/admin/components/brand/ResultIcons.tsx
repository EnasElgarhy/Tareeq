import type { SVGProps } from "react";

/**
 * ResultIcons — bespoke per-card glyphs for the assessment result page.
 *
 * Each icon is a hairline-cream + warm-gradient-flourish illustration
 * sized for 32×32 viewBox so it sits cleanly inside a circular glass
 * tile at ~40-44px. Same vocabulary as ContractIcons / InterstitialScenes
 * (cream strokes + one warm-gradient signature accent per glyph) so the
 * full app reads as one drawn language.
 *
 *   CompassIcon       — 4-point compass star, warm anchor
 *   ArchetypeIcon     — interlocking cogs / orchestrating shape
 *   DriverIcon        — pulse arrow climbing upward
 *   EcosystemIcon     — three figures in a circle (community)
 *   AcademicIcon      — graduation cap + book spine
 *   CareerIcon        — briefcase with a small spark
 *   RealityIcon       — open horizon with a warning glow
 *   FootprintsIcon    — two stepping prints leading forward
 *   ConstellationIcon — connected stars for ranked clusters
 */

interface IconProps extends SVGProps<SVGSVGElement> {
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

function iconProps(size: number | string) {
  return {
    viewBox: "0 0 32 32",
    width: size,
    height: size,
    "aria-hidden": true as const,
    focusable: false as const,
  };
}

/** Primary direction marker — sits on the hero. */
export function CompassResultIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-compass-grad" />
      </defs>
      <circle cx="16" cy="16" r="11" fill="none" stroke={SAND} strokeWidth="1.3" opacity="0.85" />
      <path
        d="M 16 4 L 19 16 L 16 19 L 13 16 Z"
        fill="url(#ric-compass-grad)"
      />
      <path
        d="M 16 28 L 13 16 L 16 13 L 19 16 Z"
        fill={SAND}
        opacity="0.3"
      />
      <circle cx="16" cy="16" r="1.8" fill="#0F0824" />
      <circle cx="16" cy="16" r="0.9" fill="#F4C660" />
    </svg>
  );
}

/** How you work — interlocking shapes / archetype. */
export function ArchetypeIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-arch-grad" />
      </defs>
      {/* Outer cream geometric — diamond */}
      <path
        d="M 16 4 L 28 16 L 16 28 L 4 16 Z"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* Inner warm-gradient diamond — the "you" inside the system */}
      <path
        d="M 16 10 L 22 16 L 16 22 L 10 16 Z"
        fill="url(#ric-arch-grad)"
      />
      {/* Center dot */}
      <circle cx="16" cy="16" r="1.3" fill={SAND} />
    </svg>
  );
}

/** What pulls you forward — pulse arrow climbing. */
export function DriverIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-driver-grad" />
      </defs>
      {/* Climbing pulse path */}
      <path
        d="M 4 22 L 10 22 L 13 14 L 17 24 L 21 10 L 24 16 L 28 16"
        fill="none"
        stroke={SAND}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* Warm crescendo over the peak */}
      <path
        d="M 13 14 L 17 24 L 21 10"
        fill="none"
        stroke="url(#ric-driver-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Apex marker */}
      <circle cx="21" cy="10" r="1.8" fill="url(#ric-driver-grad)" />
    </svg>
  );
}

/** Where you thrive — three figures in a circle (community / ecosystem). */
export function EcosystemIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-eco-grad" />
      </defs>
      {/* Outer cream circle — the ecosystem boundary */}
      <circle cx="16" cy="16" r="11" fill="none" stroke={SAND} strokeWidth="1.2" opacity="0.5" strokeDasharray="2 3" />
      {/* Three figures positioned around the center */}
      {/* Top */}
      <circle cx="16" cy="9" r="2" fill={SAND} />
      <path d="M 13 15 Q 16 12.5 19 15" fill={SAND} opacity="0.85" />
      {/* Bottom-left */}
      <circle cx="10" cy="20" r="2" fill={SAND} />
      <path d="M 7 25 Q 10 22.5 13 25" fill={SAND} opacity="0.85" />
      {/* Bottom-right — warm-gradient "you" */}
      <circle cx="22" cy="20" r="2.2" fill="url(#ric-eco-grad)" />
      <path d="M 18.8 25 Q 22 22.5 25.2 25" fill="url(#ric-eco-grad)" />
    </svg>
  );
}

/** School focus — graduation cap. */
export function AcademicIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-acad-grad" />
      </defs>
      {/* Mortarboard top */}
      <path
        d="M 4 13 L 16 8 L 28 13 L 16 18 Z"
        fill="none"
        stroke={SAND}
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.9"
      />
      {/* Cap base */}
      <path
        d="M 10 16 L 10 21 Q 16 24 22 21 L 22 16"
        fill="none"
        stroke={SAND}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Tassel — warm gradient */}
      <line
        x1="28"
        y1="13"
        x2="28"
        y2="22"
        stroke="url(#ric-acad-grad)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="28" cy="23" r="1.4" fill="url(#ric-acad-grad)" />
    </svg>
  );
}

/** University paths — open book. */
export function UniversityIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-uni-grad" />
      </defs>
      {/* Book left page */}
      <path
        d="M 5 9 Q 11 7 16 10 L 16 24 Q 11 21 5 23 Z"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* Book right page */}
      <path
        d="M 27 9 Q 21 7 16 10 L 16 24 Q 21 21 27 23 Z"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* Warm spine line */}
      <line
        x1="16"
        y1="10"
        x2="16"
        y2="24"
        stroke="url(#ric-uni-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Page text lines */}
      <path d="M 8 14 L 13 13" stroke={SAND} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <path d="M 8 17 L 13 16" stroke={SAND} strokeWidth="0.8" strokeLinecap="round" opacity="0.45" />
      <path d="M 19 13 L 24 14" stroke={SAND} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <path d="M 19 16 L 24 17" stroke={SAND} strokeWidth="0.8" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

/** Career examples — briefcase with a spark. */
export function CareerIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-career-grad" />
      </defs>
      {/* Briefcase handle */}
      <path
        d="M 12 9 L 12 7 Q 12 6 13 6 L 19 6 Q 20 6 20 7 L 20 9"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Briefcase body */}
      <rect
        x="5"
        y="10"
        width="22"
        height="14"
        rx="2"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        opacity="0.9"
      />
      {/* Center clasp */}
      <line x1="5" y1="16" x2="27" y2="16" stroke={SAND} strokeWidth="0.9" opacity="0.55" />
      {/* Warm spark — top-right corner */}
      <path
        d="M 24 4 L 24.7 6 L 26.5 6.3 L 25.2 7.6 L 25.5 9.4 L 24 8.5 L 22.5 9.4 L 22.8 7.6 L 21.5 6.3 L 23.3 6 Z"
        fill="url(#ric-career-grad)"
      />
    </svg>
  );
}

/** Reality check — open eye with horizon line. */
export function RealityIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-real-grad" />
      </defs>
      {/* Open eye almond */}
      <path
        d="M 4 16 Q 16 7 28 16 Q 16 25 4 16 Z"
        fill="none"
        stroke={SAND}
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity="0.9"
      />
      {/* Iris ring */}
      <circle cx="16" cy="16" r="4.2" fill="none" stroke={SAND} strokeWidth="1" opacity="0.7" />
      {/* Warm pupil — the moment of honest seeing */}
      <circle cx="16" cy="16" r="2.4" fill="url(#ric-real-grad)" />
      <circle cx="16.5" cy="15.5" r="0.7" fill={SAND} />
    </svg>
  );
}

/** Next steps — two footprints leading forward + warm horizon. */
export function NextStepsIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-next-grad" />
      </defs>
      {/* Back footprint — faded */}
      <ellipse cx="9" cy="22" rx="3" ry="4" fill={SAND} opacity="0.5" transform="rotate(-12 9 22)" />
      <circle cx="8" cy="17.5" r="1" fill={SAND} opacity="0.4" />
      {/* Front footprint — warm */}
      <ellipse cx="18" cy="14" rx="3" ry="4" fill="url(#ric-next-grad)" transform="rotate(8 18 14)" />
      <circle cx="19.5" cy="9.5" r="1.1" fill="url(#ric-next-grad)" />
      {/* Direction line — dashed cream */}
      <path
        d="M 22 8 L 28 6"
        stroke={SAND}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="0.1 2.5"
        opacity="0.7"
      />
    </svg>
  );
}

/** Cluster ranking — connected stars / constellation. */
export function ConstellationIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-const-grad" />
      </defs>
      {/* Threads */}
      <path
        d="M 6 22 L 13 14 L 22 18 L 26 8"
        fill="none"
        stroke={SAND}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
        strokeDasharray="1 2"
      />
      {/* Cream stars */}
      <circle cx="6" cy="22" r="1.3" fill={SAND} opacity="0.85" />
      <circle cx="22" cy="18" r="1.2" fill={SAND} opacity="0.85" />
      <circle cx="26" cy="8" r="1.1" fill={SAND} opacity="0.75" />
      {/* Anchor — warm */}
      <circle cx="13" cy="14" r="2.6" fill="url(#ric-const-grad)" />
      <circle cx="13" cy="14" r="4.6" fill="none" stroke="url(#ric-const-grad)" strokeWidth="0.8" opacity="0.55" />
    </svg>
  );
}

interface AccentIconProps extends IconProps {
  /** Override the warm-gradient signature with a solid accent color. */
  accent?: string;
}

/** CORE Fingerprint — concentric broken arcs around a center node. */
export function FingerprintIcon({ size = 28, accent, ...rest }: AccentIconProps) {
  const sig = accent ?? "url(#ric-fp-grad)";
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-fp-grad" />
      </defs>
      <path d="M 7 21 A 9.5 9.5 0 0 1 25 21" fill="none" stroke={SAND} strokeWidth="1.2" strokeLinecap="round" opacity="0.78" />
      <path d="M 10.5 20.2 A 6 6 0 0 1 21.5 20.2" fill="none" stroke={SAND} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      <path d="M 13.4 19.4 A 3.1 3.1 0 0 1 18.6 19.4" fill="none" stroke={sig} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16" cy="17.6" r="1.7" fill={sig} />
    </svg>
  );
}

/** Axis slider — two tracks with offset thumbs. */
export function AxisIcon({ size = 28, accent, ...rest }: AccentIconProps) {
  const sig = accent ?? "url(#ric-axis-grad)";
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-axis-grad" />
      </defs>
      <line x1="5" y1="11" x2="27" y2="11" stroke={SAND} strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <line x1="5" y1="21" x2="27" y2="21" stroke={SAND} strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <circle cx="21" cy="11" r="2.6" fill={sig} />
      <circle cx="11" cy="21" r="2.6" fill={sig} />
    </svg>
  );
}

/** Strength vs stretch — two unequal stacked bars. */
export function StrengthIcon({ size = 28, accent, ...rest }: AccentIconProps) {
  const sig = accent ?? "url(#ric-str-grad)";
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-str-grad" />
      </defs>
      <rect x="6" y="9" width="20" height="4.6" rx="2.3" fill={sig} />
      <rect x="6" y="18.4" width="11" height="4.6" rx="2.3" fill={SAND} opacity="0.4" />
    </svg>
  );
}

/** Path forward (Route summary) — winding path on a horizon. */
export function PathForwardIcon({ size = 28, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="ric-path-grad" />
      </defs>
      {/* Winding path */}
      <path
        d="M 4 26 C 8 24, 10 18, 14 16 C 18 14, 20 8, 24 6"
        fill="none"
        stroke="url(#ric-path-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Origin marker */}
      <circle cx="4" cy="26" r="1.6" fill={SAND} opacity="0.85" />
      {/* Destination star */}
      <path
        d="M 24 2 L 25 4.5 L 27.6 4.8 L 25.7 6.6 L 26.3 9.2 L 24 7.9 L 21.7 9.2 L 22.3 6.6 L 20.4 4.8 L 23 4.5 Z"
        fill="url(#ric-path-grad)"
      />
    </svg>
  );
}
