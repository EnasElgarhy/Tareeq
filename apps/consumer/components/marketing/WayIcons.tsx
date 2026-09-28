import type { ReactNode, SVGProps } from "react";

/**
 * Waypoint icon set — Daybreak design language.
 * 1.75px rounded strokes in currentColor so icons read on light and dark;
 * every icon carries a single gold "you are here" waypoint dot.
 */

const GOLD = "#F4C660";

export interface WayIconProps extends Omit<
  SVGProps<SVGSVGElement>,
  "children"
> {
  size?: number | string;
}

interface BaseProps extends WayIconProps {
  children: ReactNode;
  label: string;
}

interface DotProps {
  cx: number | string;
  cy: number | string;
  r?: number | string;
}

export const WayBase = ({
  size = 24,
  className = "",
  children,
  label,
}: BaseProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={label}
    className={className}
  >
    {children}
  </svg>
);

export const WayDot = ({ cx, cy, r = 2 }: DotProps) => (
  <circle cx={cx} cy={cy} r={r} fill={GOLD} stroke="none" />
);

export const WayCompass = (p: WayIconProps) => (
  <WayBase label="compass" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5 13.4 13.4 8.5 15.5l2.1-4.9z" />
    <WayDot cx="12" cy="12" r="1.6" />
  </WayBase>
);

export const WayPath = (p: WayIconProps) => (
  <WayBase label="winding path" {...p}>
    <path d="M4 20c6 0 3.5-7 8-7s2-7 8-7" strokeDasharray="0.1 3.4" />
    <circle cx="4" cy="20" r="1.4" />
    <WayDot cx="20" cy="6" />
  </WayBase>
);

export const WaySpark = (p: WayIconProps) => (
  <WayBase label="eight point star" {...p}>
    <path d="M12 3v4.2M12 16.8V21M3 12h4.2M16.8 12H21M5.6 5.6l3 3M15.4 15.4l3 3M18.4 5.6l-3 3M8.6 15.4l-3 3" />
    <WayDot cx="12" cy="12" />
  </WayBase>
);

export const WayChat = (p: WayIconProps) => (
  <WayBase label="conversation" {...p}>
    <path d="M20 12a8 8 0 1 0-3.1 6.3L20 19l-.6-3.2A8 8 0 0 0 20 12Z" />
    <path d="M8.5 11h.01M12 11h.01" />
    <WayDot cx="15.5" cy="11" r="1.6" />
  </WayBase>
);

export const WayBook = (p: WayIconProps) => (
  <WayBase label="research" {...p}>
    <path d="M12 6.5C10.6 5 8.6 4.5 5 4.5v13c3.6 0 5.6.5 7 2 1.4-1.5 3.4-2 7-2v-13c-3.6 0-5.6.5-7 2Z" />
    <path d="M12 6.5v13" />
    <WayDot cx="8.4" cy="9" r="1.4" />
  </WayBase>
);

export const WayHeart = (p: WayIconProps) => (
  <WayBase label="motivation" {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10Z" />
    <WayDot cx="12" cy="11.5" r="1.6" />
  </WayBase>
);

export const WayGauge = (p: WayIconProps) => (
  <WayBase label="working style" {...p}>
    <path d="M5 17a8 8 0 1 1 14 0" />
    <path d="M12 13.5 15.5 9" />
    <WayDot cx="12" cy="13.5" r="1.6" />
  </WayBase>
);

export const WayLeaf = (p: WayIconProps) => (
  <WayBase label="environment" {...p}>
    <path d="M19 5c-9 0-13 4.5-13 10 0 2 1 4 1 4s.5-2 3-3.5C15 13.5 19 10 19 5Z" />
    <path d="M6.5 18.5C9 13 13 9.5 16 8" />
    <WayDot cx="16" cy="8" r="1.4" />
  </WayBase>
);

export const WayGradCap = (p: WayIconProps) => (
  <WayBase label="students" {...p}>
    <path d="m3 9 9-4.5L21 9l-9 4.5L3 9Z" />
    <path d="M7 11.5V16c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.5" />
    <WayDot cx="21" cy="9" r="1.4" />
  </WayBase>
);

export const WayHands = (p: WayIconProps) => (
  <WayBase label="parents" {...p}>
    <path d="M8.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z" />
    <path d="M4 20c.8-3.4 4.1-5.5 8-5.5s7.2 2.1 8 5.5" />
    <WayDot cx="12" cy="8" r="1.4" />
  </WayBase>
);

export const WayShield = (p: WayIconProps) => (
  <WayBase label="trust" {...p}>
    <path d="M12 3.5 19 6v5.5c0 4.3-3 7.8-7 9-4-1.2-7-4.7-7-9V6l7-2.5Z" />
    <path d="m9 11.8 2 2 4-4" />
    <WayDot cx="15" cy="9.8" r="1.4" />
  </WayBase>
);

export const WayClock = (p: WayIconProps) => (
  <WayBase label="time" {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
    <WayDot cx="12" cy="12" r="1.4" />
  </WayBase>
);

export const WayGlobe = (p: WayIconProps) => (
  <WayBase label="region" {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.2 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.2-3.9-8.5s1.3-6.2 3.9-8.5Z" />
    <WayDot cx="15.9" cy="12" r="1.4" />
  </WayBase>
);

export const WayArrow = (p: WayIconProps) => (
  <WayBase label="forward" {...p}>
    <path d="M4 12h14" />
    <path d="m13 6 6 6-6 6" />
    <WayDot cx="4" cy="12" r="1.4" />
  </WayBase>
);

export const WayCheck = (p: WayIconProps) => (
  <WayBase label="check" {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
    <WayDot cx="9.5" cy="17" r="1.4" />
  </WayBase>
);

export const WayQuestion = (p: WayIconProps) => (
  <WayBase label="question" {...p}>
    <path d="M9 9a3 3 0 1 1 4.6 2.5c-1 .7-1.6 1.3-1.6 2.5" />
    <WayDot cx="12" cy="18" r="1.6" />
  </WayBase>
);

export const WayBrain = (p: WayIconProps) => (
  <WayBase label="aptitudes" {...p}>
    <path d="M9.5 4.5A2.7 2.7 0 0 0 6.8 7a2.8 2.8 0 0 0-1.6 4.8A3 3 0 0 0 7 17c.3 1.5 1.3 2.5 2.8 2.5 1.3 0 2.2-.9 2.2-2.3V6.8c0-1.4-1-2.3-2.5-2.3Z" />
    <path d="M14.5 4.5A2.7 2.7 0 0 1 17.2 7a2.8 2.8 0 0 1 1.6 4.8A3 3 0 0 1 17 17c-.3 1.5-1.3 2.5-2.8 2.5-1.3 0-2.2-.9-2.2-2.3V6.8c0-1.4 1-2.3 2.5-2.3Z" />
    <WayDot cx="12" cy="12" r="1.4" />
  </WayBase>
);

export const WayTarget = (p: WayIconProps) => (
  <WayBase label="trajectories" {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <WayDot cx="12" cy="12" r="1.8" />
  </WayBase>
);

export const WayLamp = (p: WayIconProps) => (
  <WayBase label="guidance" {...p}>
    <path d="M12 3.5a5.5 5.5 0 0 1 3 10.1c-.6.4-1 1-1 1.7v.7h-4v-.7c0-.7-.4-1.3-1-1.7a5.5 5.5 0 0 1 3-10.1Z" />
    <path d="M10.5 19.5h3" />
    <WayDot cx="12" cy="8.8" r="1.6" />
  </WayBase>
);

export const WayBolt = (p: WayIconProps) => (
  <WayBase label="lightning" {...p}>
    <path d="M13 3 5.5 13.5h5L11 21l7.5-10.5h-5L13 3Z" />
    <WayDot cx="11.6" cy="12.2" r="1.5" />
  </WayBase>
);

/**
 * Catalyst: a gold core that sets everything around it in motion —
 * particles ejected on rays plus an acceleration arc with an arrowhead.
 */
export const WayCatalyst = (p: WayIconProps) => (
  <WayBase label="catalyst" {...p}>
    {/* acceleration arc sweeping around the core */}
    <path d="M4.5 17.5A8.5 8.5 0 0 1 10.5 4.6" />
    <path d="m10.5 4.6-2.6-.2M10.5 4.6l-.7 2.5" />
    {/* particles flung outward */}
    <path d="m13.6 10.6 3-2.9" />
    <circle cx="18" cy="6.3" r="1.5" />
    <path d="m14.3 13.9 3.2 1" />
    <circle cx="19.6" cy="15.6" r="1.5" />
    <path d="m10.3 15.9-1.2 2.5" />
    <circle cx="8.2" cy="20.2" r="1.2" />
    {/* the catalyst itself — solid core so it reads on any surface */}
    <circle cx="11.6" cy="12.8" r="2.7" fill="currentColor" stroke="none" />
    <WayDot cx="11.6" cy="12.8" r="1.1" />
  </WayBase>
);

export const WayChip = (p: WayIconProps) => (
  <WayBase label="technology" {...p}>
    <rect x="7.2" y="7.2" width="9.6" height="9.6" rx="2" />
    <path d="M10 4.2v3M14 4.2v3M10 16.8v3M14 16.8v3M4.2 10h3M4.2 14h3M16.8 10h3M16.8 14h3" />
    <WayDot cx="12" cy="12" r="1.6" />
  </WayBase>
);

export const WayGear = (p: WayIconProps) => (
  <WayBase label="engineering" {...p}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 4.6V2.8M12 21.2v-1.8M4.6 12H2.8M21.2 12h-1.8M6.9 6.9 5.6 5.6M18.4 18.4l-1.3-1.3M17.1 6.9l1.3-1.3M5.6 18.4l1.3-1.3" />
    <WayDot cx="12" cy="12" r="1.7" />
  </WayBase>
);

export const WayFlask = (p: WayIconProps) => (
  <WayBase label="science" {...p}>
    <path d="M9.6 3.5h4.8M10.4 3.5v4.4l-4.7 8.8a2.2 2.2 0 0 0 2 3.3h8.6a2.2 2.2 0 0 0 2-3.3l-4.7-8.8V3.5" />
    <path d="M7.6 15h8.8" />
    <WayDot cx="10.4" cy="17.4" r="1.5" />
  </WayBase>
);

export const WayPalette = (p: WayIconProps) => (
  <WayBase label="arts and media" {...p}>
    <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2.1-.8 2.1-1.8 0-1.5-1.7-1.9-1.7-3 0-.9.9-1.5 2.1-1.5h1.7c2.4 0 4.3-1.7 4.3-4.1C20.5 6.5 16.7 3.5 12 3.5Z" />
    <circle cx="8.2" cy="9.4" r="1.1" />
    <circle cx="12" cy="7.4" r="1.1" />
    <circle cx="15.8" cy="9.4" r="1.1" />
    <WayDot cx="8.6" cy="13.8" r="1.5" />
  </WayBase>
);

export const WayChart = (p: WayIconProps) => (
  <WayBase label="business" {...p}>
    <path d="M4 19.5h16" />
    <path d="m5.5 15.5 4.5-4.5 3 3L18.5 8.5" />
    <path d="M15 8.5h3.5V12" />
    <WayDot cx="10" cy="11" r="1.5" />
  </WayBase>
);

export const WayScale = (p: WayIconProps) => (
  <WayBase label="fairness" {...p}>
    <path d="M12 4.5v15M6 7.5h12M5.5 19.5h13" />
    <path d="M6 7.5 3.5 13a2.5 2.5 0 0 0 5 0L6 7.5ZM18 7.5 15.5 13a2.5 2.5 0 0 0 5 0L18 7.5Z" />
    <WayDot cx="12" cy="4.5" r="1.4" />
  </WayBase>
);

/** The eight career clusters, each with its Waypoint icon. */
export const CAREER_CLUSTERS = [
  { label: "Technology", icon: WayChip },
  { label: "Engineering", icon: WayGear },
  { label: "Science/Data", icon: WayFlask },
  { label: "Arts/Media", icon: WayPalette },
  { label: "Business", icon: WayChart },
  { label: "Law/Diplomacy", icon: WayScale },
  { label: "People/Psychology", icon: WayHands },
  { label: "Environment", icon: WayLeaf },
];
