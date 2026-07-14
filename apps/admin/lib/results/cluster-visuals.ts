import type { ClusterCode } from "@/lib/scoring";

/**
 * Guiding cluster palette — hue-separated so each cluster is its own
 * recognizable signal on the night theme. `color` is the house hue,
 * `glow` a soft tint for auras/washes. The user's cluster color threads
 * through the report AND the home via `--result-accent`.
 *
 * Natural-association palette — each hue maps to the domain's real-world
 * cue so the color is a learnable mental model.
 *
 * Shared by ResultsScreen and the post-result Home so both surfaces wear
 * the identical cluster identity.
 */
/**
 * Each cluster carries:
 *  · `color` — the vivid house hue, tuned for the DARK theme (rings, dots,
 *     fills, large blocks).
 *  · `ink`   — a darkened variant that passes WCAG AA (>= ~5:1) as TEXT or a
 *     thin stroke on the light "warm paper" card surface. The vivid hues
 *     (gold/mint/green especially) fail as text on light, so the Home uses
 *     `ink` for anything text-like and `color` for accents/fills.
 *  · `glow`  — a soft tint for auras/washes.
 */
export const CLUSTER_VISUALS: Record<
  ClusterCode,
  { color: string; ink: string; glow: string; label: string; tagline: string }
> = {
  TECH: {
    color: "#4F8DFF", // electric blue — digital / signal
    ink: "#1D63D2",
    glow: "rgba(79,141,255,0.20)",
    label: "Technology",
    tagline: "Building systems. Solving problems. Creating tools.",
  },
  ENG: {
    color: "#FF8A4C", // amber-orange — build / forge / industrial
    ink: "#C2410C",
    glow: "rgba(255,138,76,0.20)",
    label: "Engineering",
    tagline: "Designing structures. Testing ideas. Making things work.",
  },
  SCI: {
    color: "#7466EE", // indigo — discovery / evidence / cosmos
    ink: "#5040D9",
    glow: "rgba(116,102,238,0.22)",
    label: "Science and Data",
    tagline: "Following evidence. Finding patterns. Explaining the unknown.",
  },
  ART: {
    color: "#D45CF0", // magenta — creative expression
    ink: "#A521C4",
    glow: "rgba(212,92,240,0.22)",
    label: "Arts and Media",
    tagline: "Shaping stories. Designing meaning. Moving people.",
  },
  BUS: {
    color: "#F2C14E", // gold — value / markets / money
    ink: "#6B4D00",
    glow: "rgba(242,193,78,0.20)",
    label: "Business",
    tagline: "Reading markets. Building value. Creating momentum.",
  },
  LAW: {
    color: "#20BBA8", // deep teal — balance / diplomacy / justice
    ink: "#0E7A6E",
    glow: "rgba(32,187,168,0.20)",
    label: "Law and Diplomacy",
    tagline: "Clarifying rules. Negotiating power. Protecting fairness.",
  },
  PPL: {
    color: "#FF6F91", // coral-rose — human warmth / empathy
    ink: "#C01F55",
    glow: "rgba(255,111,145,0.22)",
    label: "People and Psychology",
    tagline: "Understanding people. Building trust. Helping systems heal.",
  },
  ENV: {
    color: "#5BC96A", // green — nature / growth / ecosystems
    ink: "#1F7A3D",
    glow: "rgba(91,201,106,0.20)",
    label: "Environment",
    tagline: "Reading ecosystems. Protecting resources. Designing resilience.",
  },
};

/** Convert a `#rrggbb` hex to an `rgba()` string at the given alpha. */
export function rgbaFromHex(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Look up a cluster's house color, falling back to the brand gold. */
export function getClusterColor(code: ClusterCode | null | undefined): string {
  if (code && CLUSTER_VISUALS[code]) return CLUSTER_VISUALS[code].color;
  return "#F4C660";
}

/**
 * Look up a cluster's AA-safe ink (for text/strokes on the light surface),
 * falling back to a dark amber that pairs with the brand gold.
 */
export function getClusterInk(code: ClusterCode | null | undefined): string {
  if (code && CLUSTER_VISUALS[code]) return CLUSTER_VISUALS[code].ink;
  return "#6B4D00";
}
