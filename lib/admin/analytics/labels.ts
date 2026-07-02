/**
 * Display labels for result codes that aren't already human-readable.
 * Cluster codes have their own canonical map (lib/admin/clusters.ts);
 * archetype and ecosystem-fit values are already plain English strings.
 */
export const DRIVER_LABELS: Record<string, string> = {
  REC: "Recognition",
  IMP: "Impact",
  AUT: "Autonomy",
  MAS: "Mastery",
  STA: "Stability",
};

export function driverLabel(code: string): string {
  return DRIVER_LABELS[code] ?? code;
}

/** Cycling accent palette for categories without a canonical brand color. */
const RANK_PALETTE = [
  "var(--adm-violet)",
  "var(--adm-gold)",
  "var(--adm-mint)",
  "var(--adm-blush)",
  "var(--adm-violet-soft)",
];

export function paletteColor(index: number): string {
  return RANK_PALETTE[index % RANK_PALETTE.length];
}
