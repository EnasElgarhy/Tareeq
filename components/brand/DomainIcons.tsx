import type { SVGProps } from "react";

/**
 * DomainIcons — bespoke glyphs for career/academic concepts used across
 * the Kai, Journey, and Profile tabs (light "paper" surface).
 *
 * Same vocabulary as ResultIcons / ContractIcons — 32×32 viewBox, hairline
 * linework carrying the whole shape, one small warm-gradient marker per
 * glyph (never the icon's main shape) — just an ink stroke instead of the
 * cream one those were drawn for, since this surface is light, not dark.
 *
 *   CareerCompassIcon    — compass rose, warm direction point
 *   JourneyIcon          — dashed trail to a warm destination star
 *   KaiIcon              — dashed orbit ring around a warm core
 *   UniversityIcon2      — campus building, warm roof pennant
 *   MajorIcon            — open book, warm spine
 *   ActionPlanIcon       — checklist, warm checkmark
 *   GrowthIcon           — climbing sprout, warm bud
 *   AchievementIcon      — ribbon medal, warm star
 *   DeepDiveIcon         — ripple rings, warm descending arrow
 *   CareerComparisonIcon — balance scale, warm pivot
 *   ParentsIcon          — two speech bubbles, warm spark
 *   ResearchIcon         — magnifying glass, warm spark
 *   SkillIcon            — faceted gem, warm top facet
 *   FutureIcon           — horizon arc, warm rising sun
 *   GoalIcon             — planted flag, warm pennant
 *   ProgressIcon         — ascending bars, warm lead marker
 *   ReflectionIcon       — pond ripples, warm reflection
 *
 * The four below mirror ResultIcons' ArchetypeIcon / DriverIcon /
 * EcosystemIcon motifs exactly (same shapes, ink instead of cream) so the
 * Kai grounding card reads as the same drawn language as the results
 * screen, not a different one — plus one new marker for confidence, which
 * never had an icon before.
 *
 *   ArchetypeMarkIcon    — interlocking diamonds, warm inner
 *   DriverMarkIcon       — pulse arrow climbing, warm crescendo
 *   EcosystemMarkIcon    — three figures in a circle, warm "you"
 *   ConfidenceMarkIcon   — gauge arc, warm fill
 *
 * Learning-resource type glyphs — book/course/project/competition reuse
 * MajorIcon/GrowthIcon/ActionPlanIcon/AchievementIcon above (already
 * good fits); these five cover what nothing else does.
 *
 *   VideoIcon     — screen frame, warm play triangle
 *   ArticleIcon   — page with lines, warm accent rule
 *   PodcastIcon   — mic capsule, warm sound arc
 *   CommunityIcon — three overlapping circles, warm "you"
 *   WebsiteIcon   — globe meridians, warm pin
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
    "aria-hidden": true as const,
    focusable: false as const,
  };
}

export function CareerCompassIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-compass-grad" />
      </defs>
      <circle cx="16" cy="16" r="11" fill="none" stroke={INK} strokeWidth="1.3" opacity="0.5" />
      <path d="M16 4L19 16L16 19L13 16Z" fill="url(#di-compass-grad)" />
      <path d="M16 28L13 16L16 13L19 16Z" fill={INK} opacity="0.16" />
      <circle cx="16" cy="16" r="1.7" fill={INK} opacity="0.7" />
      <circle cx="16" cy="16" r="0.8" fill="#F4C660" />
    </svg>
  );
}

export function JourneyIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-journey-grad" />
      </defs>
      <path
        d="M4 26c4-1 5-7 9-8s6 5 10 2"
        fill="none"
        stroke={INK}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="0.1 3"
        opacity="0.5"
      />
      <circle cx="4" cy="26" r="1.4" fill={INK} opacity="0.5" />
      <path
        d="M23 16L24.4 19.4L28 19.8L25.3 22.2L26 25.8L23 23.9L20 25.8L20.7 22.2L18 19.8L21.6 19.4Z"
        fill="url(#di-journey-grad)"
      />
    </svg>
  );
}

export function KaiIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-kai-grad" />
      </defs>
      <circle cx="16" cy="16" r="11" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="1.5 3" opacity="0.35" />
      <circle cx="16" cy="16" r="6.4" fill="none" stroke="url(#di-kai-grad)" strokeWidth="0.8" opacity="0.5" />
      <circle cx="16" cy="16" r="4.2" fill="url(#di-kai-grad)" />
    </svg>
  );
}

export function UniversityIcon2({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-uni-grad" />
      </defs>
      <path d="M16 6L27 12H5Z" fill="none" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" opacity="0.5" />
      <rect x="8" y="12.5" width="16" height="10.5" fill="none" stroke={INK} strokeWidth="1.1" opacity="0.4" />
      <path d="M5 25h22" stroke={INK} strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
      <path d="M12 22.5v-6M16 22.5v-6M20 22.5v-6" stroke={INK} strokeWidth="0.7" opacity="0.25" />
      <path d="M16 3L17 5.6H15Z" fill="url(#di-uni-grad)" />
    </svg>
  );
}

export function MajorIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-major-grad" />
      </defs>
      <path
        d="M5 9Q11 7 16 10V24Q11 21 5 23Z"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <path
        d="M27 9Q21 7 16 10V24Q21 21 27 23Z"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <line x1="16" y1="10" x2="16" y2="24" stroke="url(#di-major-grad)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 14L13 13M8 17L13 16" stroke={INK} strokeWidth="0.7" strokeLinecap="round" opacity="0.3" />
      <path d="M19 13L24 14M19 16L24 17" stroke={INK} strokeWidth="0.7" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export function ActionPlanIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-plan-grad" />
      </defs>
      <rect x="7" y="6" width="18" height="20" rx="2.5" fill="none" stroke={INK} strokeWidth="1.2" opacity="0.4" />
      <path d="M11 19h10M11 22.3h6.5" stroke={INK} strokeWidth="0.9" strokeLinecap="round" opacity="0.25" />
      <path d="M18 12h5" stroke={INK} strokeWidth="0.9" strokeLinecap="round" opacity="0.25" />
      <path
        d="M10.3 12.6L12.2 14.5L15.8 10.7"
        fill="none"
        stroke="url(#di-plan-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GrowthIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-growth-grad" />
      </defs>
      <path d="M16 26V14" stroke={INK} strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
      <path
        d="M16 18c-2-4-7-4-9-4 .5 5 4 7.5 9 7Z"
        fill="none"
        stroke={INK}
        strokeWidth="1.1"
        strokeLinejoin="round"
        opacity="0.4"
      />
      <path
        d="M16 14c1-3 5-3 7-3-.5 4-3.5 6-7 5.5Z"
        fill="none"
        stroke={INK}
        strokeWidth="1.1"
        strokeLinejoin="round"
        opacity="0.4"
      />
      <circle cx="16" cy="12" r="1.8" fill="url(#di-growth-grad)" />
    </svg>
  );
}

export function AchievementIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-achieve-grad" />
      </defs>
      <circle cx="16" cy="13" r="7.5" fill="none" stroke={INK} strokeWidth="1.2" opacity="0.5" />
      <path
        d="M12 19.5L9.5 26.5L16 23L22.5 26.5L20 19.5"
        fill="none"
        stroke={INK}
        strokeWidth="1.1"
        strokeLinejoin="round"
        opacity="0.35"
      />
      <path
        d="M16 8.5L17.1 11.8L20.5 11.9L17.8 14L18.8 17.3L16 15.3L13.2 17.3L14.2 14L11.5 11.9L14.9 11.8Z"
        fill="url(#di-achieve-grad)"
      />
    </svg>
  );
}

export function DeepDiveIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-deep-grad" />
      </defs>
      <circle cx="16" cy="16" r="11" fill="none" stroke={INK} strokeWidth="1" opacity="0.18" />
      <circle cx="16" cy="16" r="7.2" fill="none" stroke={INK} strokeWidth="1" opacity="0.3" />
      <path
        d="M16 8v11m-3.5-3.5L16 19l3.5-3.5"
        fill="none"
        stroke="url(#di-deep-grad)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CareerComparisonIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-compare-grad" />
      </defs>
      <path d="M16 6v18" stroke={INK} strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
      <path d="M6 10h20" stroke={INK} strokeWidth="1.1" strokeLinecap="round" opacity="0.4" />
      <path d="M6 10L3 16a3.2 3.2 0 006 0Z" fill="none" stroke={INK} strokeWidth="1" opacity="0.35" />
      <path d="M26 10L29 16a3.2 3.2 0 01-6 0Z" fill="none" stroke={INK} strokeWidth="1" opacity="0.35" />
      <path d="M12 26h8" stroke={INK} strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
      <circle cx="16" cy="9" r="2.1" fill="url(#di-compare-grad)" />
    </svg>
  );
}

export function ParentsIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-parents-grad" />
      </defs>
      <path
        d="M6 8h13a3 3 0 013 3v4a3 3 0 01-3 3h-8l-4 3v-3H6a3 3 0 01-3-3v-4a3 3 0 013-3Z"
        fill="none"
        stroke={INK}
        strokeWidth="1.1"
        opacity="0.45"
      />
      <path
        d="M17 16.5h6a3 3 0 013 3v3a3 3 0 01-3 3h-1v2.3l-2.7-2.3H17a3 3 0 01-3-3v-1"
        fill="none"
        stroke={INK}
        strokeWidth="1"
        opacity="0.3"
      />
      <circle cx="12" cy="13" r="1.6" fill="url(#di-parents-grad)" />
    </svg>
  );
}

export function ResearchIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-research-grad" />
      </defs>
      <circle cx="13.5" cy="13.5" r="7.5" fill="none" stroke={INK} strokeWidth="1.2" opacity="0.5" />
      <path d="M18.8 18.8L27 27" stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path
        d="M13.5 9.5L14.4 12.1L17 13L14.4 13.9L13.5 16.5L12.6 13.9L10 13L12.6 12.1Z"
        fill="url(#di-research-grad)"
      />
    </svg>
  );
}

export function SkillIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-skill-grad" />
      </defs>
      <path
        d="M16 5L23 11L20 26H12L9 11Z"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <path d="M9 11h14M12 26L14 11M20 26L18 11" stroke={INK} strokeWidth="0.8" opacity="0.25" />
      <path d="M13 11L16 5L19 11Z" fill="url(#di-skill-grad)" />
    </svg>
  );
}

export function FutureIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-future-grad" />
      </defs>
      <path d="M5 20a11 11 0 0122 0" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M4 24h24" stroke={INK} strokeWidth="0.9" strokeLinecap="round" opacity="0.25" />
      <circle cx="16" cy="17" r="3.4" fill="url(#di-future-grad)" />
    </svg>
  );
}

export function GoalIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-goal-grad" />
      </defs>
      <path d="M10 27V8" stroke={INK} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M5 27h13" stroke={INK} strokeWidth="1.1" strokeLinecap="round" opacity="0.35" />
      <path d="M4 23a12 5 0 0116 0" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.2" />
      <path d="M10 8L20 11.5L10 15Z" fill="url(#di-goal-grad)" />
    </svg>
  );
}

export function ProgressIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-progress-grad" />
      </defs>
      <rect x="6" y="19" width="5" height="7" rx="1" fill="none" stroke={INK} strokeWidth="1" opacity="0.3" />
      <rect x="13.5" y="13" width="5" height="13" rx="1" fill="none" stroke={INK} strokeWidth="1" opacity="0.4" />
      <rect x="21" y="7" width="5" height="19" rx="1" fill="none" stroke={INK} strokeWidth="1" opacity="0.5" />
      <circle cx="23.5" cy="7" r="1.8" fill="url(#di-progress-grad)" />
    </svg>
  );
}

export function ReflectionIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-reflect-grad" />
      </defs>
      <path d="M6 20c3-1.4 17-1.4 20 0" stroke={INK} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <path d="M8 23.5c2.5-1 13.5-1 16 0" stroke={INK} strokeWidth="0.85" strokeLinecap="round" opacity="0.2" />
      <path d="M10 27c2-.6 10-.6 12 0" stroke={INK} strokeWidth="0.7" strokeLinecap="round" opacity="0.12" />
      <circle cx="16" cy="11" r="4" fill="url(#di-reflect-grad)" />
    </svg>
  );
}

export function ArchetypeMarkIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-arch-grad" />
      </defs>
      <path
        d="M16 4L28 16L16 28L4 16Z"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <path d="M16 10L22 16L16 22L10 16Z" fill="url(#di-arch-grad)" />
      <circle cx="16" cy="16" r="1.2" fill={INK} opacity="0.6" />
    </svg>
  );
}

export function DriverMarkIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-driver-grad" />
      </defs>
      <path
        d="M4 22L10 22L13 14L17 24L21 10L24 16L28 16"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
      <path
        d="M13 14L17 24L21 10"
        fill="none"
        stroke="url(#di-driver-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="10" r="1.7" fill="url(#di-driver-grad)" />
    </svg>
  );
}

export function EcosystemMarkIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-eco-grad" />
      </defs>
      <circle cx="16" cy="16" r="11" fill="none" stroke={INK} strokeWidth="1" opacity="0.22" strokeDasharray="2 3" />
      <circle cx="16" cy="9" r="1.9" fill={INK} opacity="0.4" />
      <path d="M13 15Q16 12.5 19 15" fill={INK} opacity="0.35" />
      <circle cx="10" cy="20" r="1.9" fill={INK} opacity="0.4" />
      <path d="M7 25Q10 22.5 13 25" fill={INK} opacity="0.35" />
      <circle cx="22" cy="20" r="2.1" fill="url(#di-eco-grad)" />
      <path d="M18.8 25Q22 22.5 25.2 25" fill="url(#di-eco-grad)" />
    </svg>
  );
}

export function ConfidenceMarkIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-conf-grad" />
      </defs>
      <path
        d="M5 22a11 11 0 0122 0"
        fill="none"
        stroke={INK}
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.22"
      />
      <path
        d="M5 22a11 11 0 0116.5-9.5"
        fill="none"
        stroke="url(#di-conf-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="21.5" cy="12.5" r="1.7" fill="url(#di-conf-grad)" />
    </svg>
  );
}

export function VideoIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-video-grad" />
      </defs>
      <rect x="4" y="8" width="24" height="17" rx="4" fill="none" stroke={INK} strokeWidth="1.2" opacity="0.45" />
      <path d="M9 25v2M23 25v2" stroke={INK} strokeWidth="1" opacity="0.3" strokeLinecap="round" />
      <path d="M13.5 13L20 16.5L13.5 20Z" fill="url(#di-video-grad)" />
    </svg>
  );
}

export function ArticleIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-article-grad" />
      </defs>
      <rect x="7" y="5" width="18" height="22" rx="2" fill="none" stroke={INK} strokeWidth="1.2" opacity="0.45" />
      <path d="M10.5 11h11M10.5 15h11M10.5 19h7" stroke={INK} strokeWidth="0.9" opacity="0.3" strokeLinecap="round" />
      <path d="M10.5 23h6" stroke="url(#di-article-grad)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PodcastIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-podcast-grad" />
      </defs>
      <rect x="12" y="5" width="8" height="13" rx="4" fill="none" stroke={INK} strokeWidth="1.2" opacity="0.45" />
      <path d="M8 15a8 8 0 0016 0" fill="none" stroke={INK} strokeWidth="1.1" opacity="0.3" strokeLinecap="round" />
      <path d="M16 23v4" stroke={INK} strokeWidth="1" opacity="0.3" strokeLinecap="round" />
      <path d="M11.5 27h9" stroke={INK} strokeWidth="1" opacity="0.3" strokeLinecap="round" />
      <path d="M22 9.5a6 6 0 010 8" fill="none" stroke="url(#di-podcast-grad)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CommunityIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-community-grad" />
      </defs>
      <circle cx="11" cy="14" r="4.2" fill="none" stroke={INK} strokeWidth="1.1" opacity="0.4" />
      <path d="M5 26c0-4 2.7-6.5 6-6.5s6 2.5 6 6.5" fill="none" stroke={INK} strokeWidth="1" opacity="0.3" />
      <circle cx="21" cy="14" r="4.2" fill="url(#di-community-grad)" />
      <path d="M15 26c0-4 2.7-6.5 6-6.5s6 2.5 6 6.5" fill="none" stroke="url(#di-community-grad)" strokeWidth="1" opacity="0.55" />
    </svg>
  );
}

export function WebsiteIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-website-grad" />
      </defs>
      <circle cx="16" cy="16" r="11" fill="none" stroke={INK} strokeWidth="1.2" opacity="0.4" />
      <path d="M5 16h22M16 5c3 3 4.5 7 4.5 11s-1.5 8-4.5 11c-3-3-4.5-7-4.5-11s1.5-8 4.5-11Z" fill="none" stroke={INK} strokeWidth="0.9" opacity="0.25" />
      <circle cx="16" cy="8" r="1.8" fill="url(#di-website-grad)" />
    </svg>
  );
}

/** Streak marker — hairline flame, warm-gradient inner core. */
export function StreakIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...iconProps(size)} {...rest}>
      <defs>
        <WarmGradient id="di-streak-grad" />
      </defs>
      {/* Classic flame silhouette — pointed top, rounded bottom bulge —
       * drawn twice at two sizes: the outer tongue in ink (structural,
       * same role as every other icon's outline) with a smaller matching
       * flame nested inside it as the one warm-gradient accent, the way
       * a real flame's brightest core sits low and center. */}
      <path
        d="M16 5c5 7 8 11 8 16a8 8 0 0 1-16 0c0-5 3-9 8-16z"
        fill="none"
        stroke={INK}
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <path d="M16 14c2.5 3.5 4 5.5 4 8a4 4 0 0 1-8 0c0-2.5 1.5-4.5 4-8z" fill="url(#di-streak-grad)" />
    </svg>
  );
}
