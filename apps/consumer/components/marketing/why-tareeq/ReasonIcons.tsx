import type { ComponentType } from "react";
import { WayBase, WayDot, type WayIconProps } from "../WayIcons";
import type { Audience } from "../whyTareeqContent";

/*
 * One icon per "Why Tareeq" reason, drawn in the Waypoint language:
 * 1.75px rounded strokes in currentColor plus a single gold waypoint dot.
 */

/** A speech bubble holding a fork: an everyday choice, the dot is yours. */
export const IconEverydayChoice = (p: WayIconProps) => (
  <WayBase label="everyday choice" {...p}>
    <path d="M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3.5V16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="M12 13.5v-3M12 10.5 9.3 7.8M12 10.5l2.2-2.2" />
    <WayDot cx="15" cy="7.2" r="1.6" />
  </WayBase>
);

/** A signpost with arms both ways: directions rather than one label. */
export const IconSignpost = (p: WayIconProps) => (
  <WayBase label="signpost" {...p}>
    <path d="M12 21V5" />
    <path d="M12 6h6l2 2-2 2h-6" />
    <path d="M12 12H6l-2 2 2 2h6" />
    <path d="M9 21h6" />
    <WayDot cx="12" cy="3.4" r="1.6" />
  </WayBase>
);

/** Steps rising to a flag, starting where you stand. */
export const IconNextSteps = (p: WayIconProps) => (
  <WayBase label="next steps" {...p}>
    <path d="M3 20h5v-4h5v-4h5V8" />
    <path d="M18 8V3l3.5 1.6L18 6.2" />
    <WayDot cx="5.5" cy="17.4" r="1.6" />
  </WayBase>
);

/** A conversation bubble with a spark: Kai, on hand. */
export const IconKaiChat = (p: WayIconProps) => (
  <WayBase label="ask kai" {...p}>
    <path d="M5 5h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6.5L6 20.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    <path d="m11 8 .9 2.1 2.1.9-2.1.9L11 14l-.9-2.1L8 11l2.1-.9z" />
    <WayDot cx="20.2" cy="4" r="1.6" />
  </WayBase>
);

/** A heart with the spark inside: what actually drives them. */
export const IconDrive = (p: WayIconProps) => (
  <WayBase label="motivation" {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />
    <path d="M12 3v1.6M6.5 4.4l.9 1.3M17.5 4.4l-.9 1.3" />
    <WayDot cx="12" cy="12.2" r="1.7" />
  </WayBase>
);

/** A magnifier over a check: the reasoning is visible. */
export const IconReasoning = (p: WayIconProps) => (
  <WayBase label="see the reasoning" {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.3 15.3 4.7 4.7" />
    <path d="m7.8 10.6 1.9 1.9 3.3-3.4" />
    <WayDot cx="20.3" cy="20.3" r="1.5" />
  </WayBase>
);

/** A folded map with a marked stop: realistic paths to explore. */
export const IconPathMap = (p: WayIconProps) => (
  <WayBase label="path map" {...p}>
    <path d="M3 6.5 9 4.5l6 2 6-2v13l-6 2-6-2-6 2z" />
    <path d="M9 4.5v13M15 6.5v13" />
    <WayDot cx="18" cy="11" r="1.6" />
  </WayBase>
);

/** Two overlapping bubbles: a conversation, not a verdict. */
export const IconConversation = (p: WayIconProps) => (
  <WayBase label="conversation" {...p}>
    <path d="M4 4h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8.5L5.5 15.5V13H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="M16.5 9H20a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2h-1V20l-3-2.5h-4a2 2 0 0 1-2-2V14" />
    <WayDot cx="8.5" cy="8.5" r="1.6" />
  </WayBase>
);

export const REASON_ICONS: Record<
  Audience,
  readonly ComponentType<WayIconProps>[]
> = {
  learners: [IconEverydayChoice, IconSignpost, IconNextSteps, IconKaiChat],
  parents: [IconDrive, IconReasoning, IconPathMap, IconConversation],
};

/** Brand accents cycled across the four reasons, matching the CORE tiles. */
export const REASON_ACCENTS = [
  "#B07A18",
  "#6D5BA8",
  "#C96F63",
  "#3D8A73",
] as const;
