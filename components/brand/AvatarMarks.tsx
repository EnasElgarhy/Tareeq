import type { SVGProps } from "react";

/**
 * Symbolic fallback-avatar marks — abstract journey/potential motifs
 * (compass, spark, orbit...), never a literal face or initials. Same
 * vocabulary as DomainIcons/ResultIcons: ink hairline linework carries
 * the shape, ONE small warm-gradient accent per mark. Kept in their own
 * file since they're picked by lib/profile/avatar.ts as a set, not
 * looked up individually the way DomainIcons are.
 */

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

const INK = "#14101F";

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
    fill: "none",
  };
}

export function CompassMark({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="am-compass-grad" />
      </defs>
      <circle cx="16" cy="16" r="11" stroke={INK} strokeWidth="1.3" opacity="0.65" />
      <path d="M20 12L14 14L12 20L18 18Z" fill="url(#am-compass-grad)" />
    </svg>
  );
}

export function SparkMark({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="am-spark-grad" />
      </defs>
      <path
        d="M16 6L18.2 13.8L26 16L18.2 18.2L16 26L13.8 18.2L6 16L13.8 13.8Z"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <circle cx="16" cy="16" r="3" fill="url(#am-spark-grad)" />
    </svg>
  );
}

export function OrbitMark({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="am-orbit-grad" />
      </defs>
      <ellipse cx="16" cy="16" rx="11" ry="6" stroke={INK} strokeWidth="1.2" opacity="0.6" />
      <ellipse
        cx="16"
        cy="16"
        rx="6"
        ry="11"
        stroke={INK}
        strokeWidth="1.2"
        opacity="0.35"
        transform="rotate(35 16 16)"
      />
      <circle cx="25.5" cy="16" r="2.4" fill="url(#am-orbit-grad)" />
    </svg>
  );
}

export function PrismMark({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="am-prism-grad" />
      </defs>
      <path d="M16 7L25 23H7Z" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" opacity="0.6" />
      <path d="M16 7L20.5 23H11.5Z" fill="url(#am-prism-grad)" opacity="0.9" />
    </svg>
  );
}

export function WaveMark({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="am-wave-grad" />
      </defs>
      <path
        d="M5 19C8 13 11 13 14 19C17 25 20 25 23 19C24.5 16 26 15 27 15.5"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.62"
      />
      <circle cx="14" cy="19" r="2.6" fill="url(#am-wave-grad)" />
    </svg>
  );
}

export function PeakMark({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="am-peak-grad" />
      </defs>
      <path d="M6 24L13 12L18 19L21 14L27 24Z" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" opacity="0.6" />
      <circle cx="21" cy="9" r="2.6" fill="url(#am-peak-grad)" />
    </svg>
  );
}

export function LeafMark({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="am-leaf-grad" />
      </defs>
      <path
        d="M9 23C7 14 13 7 24 7C24 18 17 24 9 23Z"
        stroke={INK}
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity="0.6"
      />
      <path d="M9 23C13 18 17 13 24 7" stroke="url(#am-leaf-grad)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ConstellationMark({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="am-constellation-grad" />
      </defs>
      <path d="M8 22L14 10L23 14L20 24Z" stroke={INK} strokeWidth="1.1" opacity="0.4" />
      <circle cx="8" cy="22" r="1.5" fill={INK} opacity="0.55" />
      <circle cx="23" cy="14" r="1.5" fill={INK} opacity="0.55" />
      <circle cx="20" cy="24" r="1.5" fill={INK} opacity="0.55" />
      <circle cx="14" cy="10" r="2.8" fill="url(#am-constellation-grad)" />
    </svg>
  );
}

export const AVATAR_MARKS = [
  CompassMark,
  SparkMark,
  OrbitMark,
  PrismMark,
  WaveMark,
  PeakMark,
  LeafMark,
  ConstellationMark,
] as const;
