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

/** Cocoa with a faint topographic map whose two trails meet (Gemini
 * artwork), washed darker on the text side so white copy keeps contrast. */
export const CURIOSITY_TILE_BG = [
  "linear-gradient(90deg, rgb(74 44 23 / 0.45) 0%, rgb(74 44 23 / 0.15) 60%, rgb(74 44 23 / 0) 100%)",
  'url("/report/curiosity-card-bg-topo.webp") right center / cover no-repeat',
  "var(--daybreak-cocoa)",
].join(", ");

/** Strand / ring colour and icon colour per leading curiosity, by position. */
export const STRANDS = [
  { stroke: "#f3d9b1", icon: "#7a4a21" },
  { stroke: "#e9805f", icon: "#b4502f" },
  { stroke: "#c3b4ee", icon: "#5c4a96" },
] as const;
