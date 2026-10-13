/**
 * At a glance colours. Filled surfaces carrying white text use the deeper
 * letter colours (4.5:1); the curiosity tile is cocoa, the C letter's own
 * brown at its darkest.
 */
export const LETTER_FILL = {
  C: "var(--daybreak-gold-ink)",
  O: "var(--daybreak-green-deep)",
  R: "var(--daybreak-clay-deep)",
  E: "var(--daybreak-violet-deep)",
} as const;

export const CURIOSITY_TILE_BG = "var(--daybreak-cocoa)";

/** Strand / ring colour and icon colour per leading curiosity, by position. */
export const STRANDS = [
  { stroke: "#f3d9b1", icon: "#7a4a21" },
  { stroke: "#e9805f", icon: "#b4502f" },
  { stroke: "#c3b4ee", icon: "#5c4a96" },
] as const;
