"use client";

import { useId, type ReactNode } from "react";
import type { AxisSide, CuriosityCode, MotivatorCode } from "@/lib/core-v2/types";

/**
 * Report glyphs in the brand icon language (components/brand/DomainIcons):
 * 32×32, hairline linework carrying the whole shape, and one small
 * warm-gradient marker per glyph, never the main shape. Lines use
 * currentColor so a glyph reads on cream cards and on the violet fill alike.
 */

export interface GlyphProps {
  size?: number;
  className?: string;
}

type Draw = (warm: string) => ReactNode;

const LINE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function glyph(draw: Draw) {
  return function Glyph({ size = 28, className }: GlyphProps) {
    const id = useId().replace(/:/g, "");
    const warm = `url(#warm-${id})`;
    return (
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        aria-hidden="true"
        focusable="false"
        className={className}
      >
        <defs>
          <linearGradient id={`warm-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF3D83" />
            <stop offset="55%" stopColor="#FF6B3D" />
            <stop offset="100%" stopColor="#FFA53D" />
          </linearGradient>
        </defs>
        {draw(warm)}
      </svg>
    );
  };
}

/* ------------------------------------------------------------ curiosities */

const ResearchGlyph = glyph((warm) => (
  <>
    <circle cx="14" cy="14" r="7.5" {...LINE} />
    <path d="M19.5 19.5L26 26" {...LINE} strokeWidth={2.2} />
    <path d="M14 9.5l1.1 3.4 3.4 1.1-3.4 1.1L14 18.5l-1.1-3.4-3.4-1.1 3.4-1.1z" fill={warm} />
  </>
));

const ImaginationGlyph = glyph((warm) => (
  <>
    <path d="M6 24c3-1 4-4 6-6l8-8 2 2-8 8c-2 2-5 3-8 4z" {...LINE} />
    <path d="M20 10l3-3 2 2-3 3" {...LINE} />
    <circle cx="9" cy="9" r="3" fill={warm} />
  </>
));

const PeopleGlyph = glyph((warm) => (
  <>
    <circle cx="11" cy="11" r="3.2" {...LINE} />
    <circle cx="21" cy="11" r="3.2" {...LINE} />
    <path d="M5 24c0-3.5 2.7-6 6-6s6 2.5 6 6M15 24c0-3.5 2.7-6 6-6s6 2.5 6 6" {...LINE} />
    <path d="M16 21.5s-2.6-1.6-2.6-3.3c0-.9.7-1.5 1.4-1.5.5 0 .9.3 1.2.7.3-.4.7-.7 1.2-.7.7 0 1.4.6 1.4 1.5 0 1.7-2.6 3.3-2.6 3.3z" fill={warm} />
  </>
));

const EnterpriseGlyph = glyph((warm) => (
  <>
    <path d="M6 13v6l4 1 12 5V7L10 12z" {...LINE} />
    <path d="M10 20l1.5 5h3l-1-4.2" {...LINE} />
    <path d="M25 12.5c1.4.8 1.4 6.2 0 7" {...LINE} />
    <circle cx="25.5" cy="16" r="1.8" fill={warm} />
  </>
));

const PlanningGlyph = glyph((warm) => (
  <>
    <rect x="7" y="5" width="18" height="22" rx="3" {...LINE} />
    <path d="M12 12h9M12 17h9M12 22h5" {...LINE} />
    <path d="M9.4 11.6l.9.9 1.7-1.9" stroke={warm} strokeWidth={1.8} fill="none" strokeLinecap="round" />
  </>
));

const TechnologyGlyph = glyph((warm) => (
  <>
    <rect x="5" y="7" width="22" height="15" rx="2.5" {...LINE} />
    <path d="M12 26h8M16 22v4" {...LINE} />
    <path d="M10 13l-2 1.8 2 1.8M22 13l2 1.8-2 1.8" {...LINE} />
    <circle cx="16" cy="14.8" r="2" fill={warm} />
  </>
));

const InventionGlyph = glyph((warm) => (
  <>
    <circle cx="20" cy="12" r="5" {...LINE} />
    <path d="M20 5.5v2M20 16.5v2M13.5 12h2M24.5 12h2" {...LINE} />
    <path d="M6 26l9-9" {...LINE} strokeWidth={2.4} />
    <path d="M17.5 21l-2 3.6h2.4l-1.4 3.4" stroke={warm} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>
));

const ActionGlyph = glyph((warm) => (
  <>
    <path d="M4 26l8-13 5 7 3-4 8 10z" {...LINE} />
    <path d="M20 16V6" {...LINE} />
    <path d="M20 6h6l-2 2.2 2 2.2h-6z" fill={warm} />
  </>
));

export const CURIOSITY_GLYPH: Record<CuriosityCode, (p: GlyphProps) => ReactNode> = {
  RD: ResearchGlyph,
  IE: ImaginationGlyph,
  PW: PeopleGlyph,
  EI: EnterpriseGlyph,
  PE: PlanningGlyph,
  TS: TechnologyGlyph,
  IR: InventionGlyph,
  AE: ActionGlyph,
};

/* ------------------------------------------------------------- motivators */

const RecognitionGlyph = glyph((warm) => (
  <>
    <circle cx="16" cy="12" r="7" {...LINE} />
    <path d="M12 18l-2 9 6-3 6 3-2-9" {...LINE} />
    <path d="M16 8.5l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill={warm} />
  </>
));

const ImpactGlyph = glyph((warm) => (
  <>
    <path d="M4 21h5l5 2.5h7l5-4-1.5-1.5-5 2.5h-5" {...LINE} />
    <path d="M9 21v-4h5l4 2" {...LINE} />
    <path d="M18 13s-4-2.4-4-5c0-1.3 1-2.2 2.1-2.2.8 0 1.5.5 1.9 1.1.4-.6 1.1-1.1 1.9-1.1 1.1 0 2.1.9 2.1 2.2 0 2.6-4 5-4 5z" fill={warm} />
  </>
));

const MasteryGlyph = glyph((warm) => (
  <>
    <path d="M5 26h6v-6h6v-6h6V8" {...LINE} />
    <path d="M5 26h22" {...LINE} />
    <circle cx="23" cy="6" r="2.4" fill={warm} />
  </>
));

const AutonomyGlyph = glyph((warm) => (
  <>
    <circle cx="16" cy="16" r="10.5" {...LINE} />
    <path d="M16 16l5-7-1.5 8.5z" fill={warm} />
    <path d="M16 16l-5 7 1.5-8.5z" {...LINE} />
  </>
));

const SecurityGlyph = glyph((warm) => (
  <>
    <path d="M16 4l10 4v7c0 6-4.4 10.4-10 13-5.6-2.6-10-7-10-13V8z" {...LINE} />
    <path d="M11.5 16l3.2 3.2 6-6.4" stroke={warm} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>
));

const IncomeGlyph = glyph((warm) => (
  <>
    <ellipse cx="13" cy="21" rx="8" ry="3" {...LINE} />
    <path d="M5 21v3c0 1.7 3.6 3 8 3s8-1.3 8-3v-3" {...LINE} />
    <ellipse cx="13" cy="15.5" rx="8" ry="3" {...LINE} />
    <circle cx="23" cy="9" r="4.5" fill={warm} />
  </>
));

const FamilyGlyph = glyph((warm) => (
  <>
    <path d="M4 15L16 5l12 10" {...LINE} />
    <path d="M7 13v13h18V13" {...LINE} />
    <path d="M16 23s-3.6-2.2-3.6-4.6c0-1.2.9-2 1.9-2 .7 0 1.3.4 1.7 1 .4-.6 1-1 1.7-1 1 0 1.9.8 1.9 2 0 2.4-3.6 4.6-3.6 4.6z" fill={warm} />
  </>
));

const LifestyleGlyph = glyph((warm) => (
  <>
    <path d="M4 25c4-2 8-2 12 0s8 2 12 0" {...LINE} />
    <path d="M9 21l6-11 2 4" {...LINE} />
    <circle cx="22" cy="10" r="4" fill={warm} />
  </>
));

export const MOTIVATOR_GLYPH: Record<MotivatorCode, (p: GlyphProps) => ReactNode> = {
  REC: RecognitionGlyph,
  IMP: ImpactGlyph,
  MAS: MasteryGlyph,
  AUT: AutonomyGlyph,
  SEC: SecurityGlyph,
  INC: IncomeGlyph,
  FAM: FamilyGlyph,
  LIF: LifestyleGlyph,
};

/* ------------------------------------------------- how you work, setting */

const SetOutGlyph = glyph((warm) => (
  <>
    <path d="M5 26h6v-5h6v-5h6v-5h4" {...LINE} />
    <circle cx="8" cy="22.5" r="1.6" fill={warm} />
  </>
));

const OwnWayGlyph = glyph((warm) => (
  <>
    <path d="M16 27v-8M16 19c0-4-6-5-6-11M16 19c0-4 6-5 6-11" {...LINE} />
    <path d="M10 8l-2 2M10 8l2 2" {...LINE} />
    <circle cx="22" cy="7" r="2.2" fill={warm} />
  </>
));

const DeepGlyph = glyph((warm) => (
  <>
    <ellipse cx="16" cy="9" rx="10" ry="3.2" {...LINE} />
    <ellipse cx="16" cy="9" rx="5.5" ry="1.6" {...LINE} opacity={0.6} />
    <path d="M16 13v12" {...LINE} />
    <path d="M12.5 22l3.5 4 3.5-4" stroke={warm} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>
));

const BroadGlyph = glyph((warm) => (
  <>
    <circle cx="7" cy="9" r="2.4" {...LINE} />
    <circle cx="25" cy="9" r="2.4" {...LINE} />
    <circle cx="7" cy="24" r="2.4" {...LINE} />
    <circle cx="25" cy="24" r="2.4" {...LINE} />
    <path d="M9 10.5l5 4M23 10.5l-5 4M9 22.5l5-4M23 22.5l-5-4" {...LINE} />
    <circle cx="16" cy="16.5" r="3" fill={warm} />
  </>
));

const TogetherGlyph = glyph((warm) => (
  <>
    <circle cx="9" cy="11" r="3" {...LINE} />
    <circle cx="23" cy="11" r="3" {...LINE} />
    <path d="M3.5 25c0-3.5 2.4-6 5.5-6s5.5 2.5 5.5 6M17.5 25c0-3.5 2.4-6 5.5-6s5.5 2.5 5.5 6" {...LINE} />
    <circle cx="16" cy="8" r="2.4" fill={warm} />
  </>
));

const OwnGlyph = glyph((warm) => (
  <>
    <circle cx="16" cy="10.5" r="3.5" {...LINE} />
    <path d="M9 26c0-4.2 3.1-7.5 7-7.5s7 3.3 7 7.5" {...LINE} />
    <circle cx="24.5" cy="7.5" r="2.2" fill={warm} />
  </>
));

const SteadyGlyph = glyph((warm) => (
  <>
    <path d="M5 15L16 6l11 9" {...LINE} />
    <path d="M8 13v13h16V13" {...LINE} />
    <circle cx="16" cy="19" r="3.4" fill={warm} />
  </>
));

const ChangingGlyph = glyph((warm) => (
  <>
    <path d="M5 10h15l-3-3M27 22H12l3 3" {...LINE} />
    <path d="M5 22c4 0 6-12 11-12" {...LINE} opacity={0.5} />
    <circle cx="23.5" cy="10" r="2.6" fill={warm} />
  </>
));

const MixGlyph = glyph((warm) => (
  <>
    <circle cx="12" cy="16" r="6" {...LINE} />
    <circle cx="20" cy="16" r="6" {...LINE} />
    <path d="M16 11.5a6 6 0 0 1 0 9 6 6 0 0 1 0-9z" fill={warm} />
  </>
));

export const SIDE_GLYPH: Record<AxisSide, (p: GlyphProps) => ReactNode> = {
  S: SetOutGlyph,
  F: OwnWayGlyph,
  D: DeepGlyph,
  B: BroadGlyph,
  T: TogetherGlyph,
  O: OwnGlyph,
  ST: SteadyGlyph,
  CH: ChangingGlyph,
};
export { MixGlyph };

/* --------------------------------------------------------- next steps etc. */

export const WatchGlyph = glyph((warm) => (
  <>
    <rect x="4" y="7" width="24" height="16" rx="3" {...LINE} />
    <path d="M11 27h10" {...LINE} />
    <path d="M14 11.5l6 3.5-6 3.5z" fill={warm} />
  </>
));

export const TryGlyph = glyph((warm) => (
  <>
    <path d="M12 4h8M13.5 4v8L6.5 24.5A2.3 2.3 0 0 0 8.5 28h15a2.3 2.3 0 0 0 2-3.5L18.5 12V4" {...LINE} />
    <path d="M9.5 20.5h13l2.4 4.1a1 1 0 0 1-.9 1.4H8a1 1 0 0 1-.9-1.4z" fill={warm} />
  </>
));

export const TalkGlyph = glyph((warm) => (
  <>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h12A2.5 2.5 0 0 1 21 7.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V16h-.5A2.5 2.5 0 0 1 4 13.5z" {...LINE} />
    <path d="M24 11h1.5A2.5 2.5 0 0 1 28 13.5v6a2.5 2.5 0 0 1-2.5 2.5H25v3.5L21 22h-5" {...LINE} />
    <circle cx="12.5" cy="10.5" r="2" fill={warm} />
  </>
));

export const AskGlyph = glyph((warm) => (
  <>
    <path d="M3 12l13-6 13 6-13 6z" {...LINE} />
    <path d="M9 15v6c0 2 3.1 4 7 4s7-2 7-4v-6" {...LINE} />
    <path d="M29 12v7" {...LINE} />
    <circle cx="29" cy="21" r="2" fill={warm} />
  </>
));

export const StarGlyph = glyph((warm) => (
  <path
    d="M16 3.5l3.2 8.3 8.8.9-6.7 5.9 2 8.7L16 22.8l-7.3 4.5 2-8.7-6.7-5.9 8.8-.9z"
    fill={warm}
  />
));

export const StudyGlyph = glyph((warm) => (
  <>
    <path d="M4 8c4-2 8-2 12 1 4-3 8-3 12-1v17c-4-2-8-2-12 1-4-3-8-3-12-1z" {...LINE} />
    <path d="M16 9v17" stroke={warm} strokeWidth={2} />
  </>
));

export const CheckGlyph = glyph((warm) => (
  <>
    <circle cx="14" cy="14" r="8" {...LINE} />
    <path d="M20 20l6.5 6.5" {...LINE} strokeWidth={2.2} />
    <path d="M14 10v4.5" stroke={warm} strokeWidth={2} strokeLinecap="round" />
    <circle cx="14" cy="18" r="1.3" fill={warm} />
  </>
));

export const ChangingWorkGlyph = glyph((warm) => (
  <>
    <circle cx="13" cy="15" r="5" {...LINE} />
    <path d="M13 7.5v2M13 20.5v2M5.5 15h2M18.5 15h2M7.7 9.7l1.4 1.4M16.9 18.9l1.4 1.4M7.7 20.3l1.4-1.4M16.9 11.1l1.4-1.4" {...LINE} />
    <path d="M22 26l5-5M27 21v4h-4" stroke={warm} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>
));

export const IsGlyph = glyph((warm) => (
  <>
    <circle cx="16" cy="16" r="11" {...LINE} />
    <path d="M10.5 16.5l3.6 3.6 7.4-8" stroke={warm} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </>
));

export const IsntGlyph = glyph((warm) => (
  <>
    <circle cx="16" cy="16" r="11" {...LINE} />
    <path d="M11.5 11.5l9 9M20.5 11.5l-9 9" stroke={warm} strokeWidth={2.2} strokeLinecap="round" />
  </>
));

export const ParentsGlyph = glyph((warm) => (
  <>
    <circle cx="11" cy="9" r="3.5" {...LINE} />
    <circle cx="22" cy="13" r="2.6" {...LINE} />
    <path d="M4 27c0-5 3.1-9 7-9s7 4 7 9M17 27c0-3.6 2.2-6.5 5-6.5s5 2.9 5 6.5" {...LINE} />
    <circle cx="17" cy="5" r="2" fill={warm} />
  </>
));

/* --------------------------------------------------------- reading notes */

/** A marked test sheet, struck through: "not a test score". */
export const NoScoreGlyph = glyph((warm) => (
  <>
    <rect x="8" y="5" width="16" height="22" rx="3" {...LINE} />
    <path d="M12 11h8M12 15.5h8M12 20h4" {...LINE} opacity={0.55} />
    <path d="M6 26L26 6" stroke={warm} strokeWidth={2.2} strokeLinecap="round" />
  </>
));

/** A sprout with a warm bud: interests grow and change. */
export const GrowthGlyph = glyph((warm) => (
  <>
    <path d="M16 27V14" {...LINE} />
    <path d="M16 18c-5 0-8-3-8-8 5 0 8 3 8 8zM16 14c0-4.5 3-7.5 8-7.5 0 4.5-3 7.5-8 7.5z" {...LINE} />
    <path d="M9 27h14" {...LINE} />
    <circle cx="16" cy="12.5" r="2.2" fill={warm} />
  </>
));

/** A compass rose with a warm north point: the report as a direction, not a verdict. */
export const CompassGlyph = glyph((warm) => (
  <>
    <circle cx="16" cy="16" r="11.5" {...LINE} />
    <path d="M16 5.5L18.6 16 16 18.2 13.4 16z" fill={warm} />
    <path d="M16 26.5L13.4 16 16 13.8 18.6 16z" {...LINE} />
  </>
));
