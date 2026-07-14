import type { ClusterCode } from "@/lib/scoring";
import type { StringKey } from "@/lib/i18n/strings";

type Translate = (key: StringKey) => string;

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
 * the identical cluster identity. Adopted from the `wip/session-home-
 * gemini-docs` branch's version, which is a genuine improvement over an
 * earlier, simpler extraction here — it adds the AA-safe `ink` variant
 * every light-surface (warm-paper) consumer needs and this one didn't
 * have yet.
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
  {
    color: string;
    ink: string;
    glow: string;
    labelKey: StringKey;
    taglineKey: StringKey;
  }
> = {
  TECH: {
    color: "#4F8DFF", // electric blue — digital / signal
    ink: "#1D63D2",
    glow: "rgba(79,141,255,0.20)",
    labelKey: "report.cluster.tech.label",
    taglineKey: "report.cluster.tech.tagline",
  },
  ENG: {
    color: "#FF8A4C", // amber-orange — build / forge / industrial
    ink: "#C2410C",
    glow: "rgba(255,138,76,0.20)",
    labelKey: "report.cluster.eng.label",
    taglineKey: "report.cluster.eng.tagline",
  },
  SCI: {
    color: "#7466EE", // indigo — discovery / evidence / cosmos
    ink: "#5040D9",
    glow: "rgba(116,102,238,0.22)",
    labelKey: "report.cluster.sci.label",
    taglineKey: "report.cluster.sci.tagline",
  },
  ART: {
    color: "#D45CF0", // magenta — creative expression
    ink: "#A521C4",
    glow: "rgba(212,92,240,0.22)",
    labelKey: "report.cluster.art.label",
    taglineKey: "report.cluster.art.tagline",
  },
  BUS: {
    color: "#F2C14E", // gold — value / markets / money
    ink: "#6B4D00",
    glow: "rgba(242,193,78,0.20)",
    labelKey: "report.cluster.bus.label",
    taglineKey: "report.cluster.bus.tagline",
  },
  LAW: {
    color: "#20BBA8", // deep teal — balance / diplomacy / justice
    ink: "#0E7A6E",
    glow: "rgba(32,187,168,0.20)",
    labelKey: "report.cluster.law.label",
    taglineKey: "report.cluster.law.tagline",
  },
  PPL: {
    color: "#FF6F91", // coral-rose — human warmth / empathy
    ink: "#C01F55",
    glow: "rgba(255,111,145,0.22)",
    labelKey: "report.cluster.ppl.label",
    taglineKey: "report.cluster.ppl.tagline",
  },
  ENV: {
    color: "#5BC96A", // green — nature / growth / ecosystems
    ink: "#1F7A3D",
    glow: "rgba(91,201,106,0.20)",
    labelKey: "report.cluster.env.label",
    taglineKey: "report.cluster.env.tagline",
  },
};

/** Localized cluster label — call sites hold a `t()` from `useLocale()`. */
export function getClusterLabel(code: ClusterCode, t: Translate): string {
  return t(CLUSTER_VISUALS[code].labelKey);
}

/** Localized cluster tagline — call sites hold a `t()` from `useLocale()`. */
export function getClusterTagline(code: ClusterCode, t: Translate): string {
  return t(CLUSTER_VISUALS[code].taglineKey);
}

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
