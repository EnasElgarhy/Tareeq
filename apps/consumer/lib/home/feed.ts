import type { StringKey } from "@/lib/i18n/strings";
import { buildKaiStarterPrompts } from "@/lib/kai/starter-prompts";
import { getClusterLabel } from "@/lib/results/cluster-visuals";
import type { PersonalizedCompassReport } from "@/lib/results/types";

/**
 * The Home "Compass Feed" model.
 *
 * The Overview tab is a personalized, ever-fresh feed — content-forward
 * on top, with the progress/unlock spine threaded through. Each visit
 * rotates which items surface first, so it never looks identical twice.
 *
 * PERSONALIZATION SEAM
 * --------------------
 * `buildHomeFeed` assembles an ordered feed from a content POOL. Today the
 * pool is derived deterministically from the CORE report (L0/L1-shaped).
 * The intended evolution:
 *   · L1  — generate the pool once with Claude at report time and cache it
 *           on the report object; this builder then just assembles + rotates
 *           (zero per-visit AI cost).
 *   · L2  — feed behavioral signals (taps / saves / dismissals / recency)
 *           into the ordering and trigger a weekly pool regeneration.
 * Because the builder is a pure function of (report, seed, t), swapping the
 * pool source is a localized change. `t` is threaded in explicitly (rather
 * than read from a React hook) so this stays plain, synchronously-testable
 * TypeScript — same philosophy as lib/kai/proactive/proactive-render.ts.
 */

type Translate = (key: StringKey) => string;

export type FeedAccent = "cluster" | "gold" | "violet" | "mint";

export interface TodayCard {
  kind: "today";
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  source?: string;
}

export interface NextStepCard {
  kind: "next-step";
  id: string;
  label: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  external?: boolean;
  accent: FeedAccent;
}

export interface SpotlightCard {
  kind: "spotlight";
  id: string;
  career: string;
  why: string;
  watchHref: string;
}

export interface UnlockCard {
  kind: "unlock";
  id: string;
  moduleName: string;
  tagline: string;
  durationLabel: string;
  completionPct: number;
  completedCount: number;
  totalCount: number;
}

export interface InsightCard {
  kind: "insight";
  id: string;
  eyebrow: string;
  title: string;
  body: string;
}

export interface IntersectionCard {
  kind: "intersection";
  id: string;
  title: string;
  paths: string[];
}

export interface AskKaiCard {
  kind: "ask-kai";
  id: string;
  prompt: string;
  /** Where tapping the lead prompt goes — defaults to "/kai?prompt=..."
   * (starts the chat with `prompt` as the opening message) when absent.
   * Set to a specific destination when `prompt` is a real proactive
   * moment (e.g. resuming a conversation) rather than the generic opener. */
  href?: string;
  /** Additional profile-derived conversation starters shown as their
   * own tappable bubbles below the lead prompt — each starts a real
   * chat with that exact text (lib/kai/starter-prompts.ts). */
  morePrompts: string[];
  /** One short sentence, less weight than the actions — what Kai knows
   * ("Your Compass points toward Law & Diplomacy."). Not a chat prompt. */
  focusLine: string;
}

export type HomeFeedCard =
  | TodayCard
  | NextStepCard
  | SpotlightCard
  | UnlockCard
  | InsightCard
  | IntersectionCard
  | AskKaiCard;

export interface NextLockedModule {
  name: string;
  tagline: string;
  durationLabel: string;
}

export interface BuildHomeFeedInput {
  report: PersonalizedCompassReport;
  /** Rotation seed — day index + visit count. Same seed → same feed. */
  seed: number;
  /** Journey progress, from `readProfileSnapshot`. */
  progress: {
    completionPct: number;
    completedCount: number;
    totalCount: number;
  };
  /** The next module the user could unlock, if any. */
  nextModule: NextLockedModule | null;
  /** A real, already-rendered proactive moment (see lib/kai/proactive/) —
   * pre-rendered by the caller since it needs KaiProactiveMoment-specific
   * rendering this module doesn't have. When present, replaces the
   * generic "Ask Kai" opener with Kai's actual recommended next move.
   * Null/absent falls back to the generic prompt (e.g. no
   * assessment-derived moment worth leading with). */
  proactiveMoment?: { text: string; href: string } | null;
  /** Localizes every card's copy — see the Translate note above. */
  t: Translate;
}

function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query,
  )}`;
}

/** Rotate an array so element `seed % len` comes first (non-mutating). */
function rotate<T>(items: readonly T[], seed: number): T[] {
  if (items.length === 0) return [];
  const offset = ((seed % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

// ---------- Pool builders (L1 seam — swap for cached Claude output) ----------

/** A rotating pool of "Today" sparks — the soft daily beat. */
function buildSparkPool(report: PersonalizedCompassReport, t: Translate): TodayCard[] {
  const cluster = getClusterLabel(report.clusterCode, t);
  const driver = report.primaryDriver.toLowerCase();
  return [
    {
      kind: "today",
      id: "spark-curiosity",
      eyebrow: t("home.feed.spark.curiosity.eyebrow"),
      title: t("home.feed.spark.curiosity.title"),
      body: t("home.feed.spark.curiosity.body").replace("{cluster}", cluster),
      source: t("home.feed.spark.curiosity.source"),
    },
    {
      kind: "today",
      id: "spark-reward",
      eyebrow: t("home.feed.spark.reward.eyebrow"),
      title: t("home.feed.spark.reward.title"),
      body: t("home.feed.spark.reward.body").replace("{driver}", driver),
    },
    {
      kind: "today",
      id: "spark-region",
      eyebrow: t("home.feed.spark.region.eyebrow"),
      title: t("home.feed.spark.region.title"),
      body: t("home.feed.spark.region.body"),
      source: t("home.feed.spark.region.source"),
    },
    {
      kind: "today",
      id: "spark-intersections",
      eyebrow: t("home.feed.spark.curiosity.eyebrow"),
      title: t("home.feed.spark.intersections.title"),
      body: t("home.feed.spark.intersections.body").replace("{cluster}", cluster),
    },
    {
      kind: "today",
      id: "spark-softskills",
      eyebrow: t("home.feed.spark.reward.eyebrow"),
      title: t("home.feed.spark.softskills.title"),
      body: t("home.feed.spark.softskills.body"),
      source: t("home.feed.spark.softskills.source"),
    },
  ];
}

/** A rotating pool of single, concrete next actions. */
function buildNextStepPool(report: PersonalizedCompassReport, t: Translate): NextStepCard[] {
  const cluster = getClusterLabel(report.clusterCode, t);
  const topCareer = report.careerExamples[0];
  const topMajor = report.universityMajors[0];
  const steps: NextStepCard[] = [];

  if (topCareer) {
    steps.push({
      kind: "next-step",
      id: "step-watch-career",
      label: t("home.feed.step.watch_career.label"),
      title: t("home.feed.step.watch_career.title").replace("{career}", topCareer),
      body: t("home.feed.step.watch_career.body"),
      cta: t("home.feed.step.watch_career.cta"),
      href: youtubeSearchUrl(`day in the life of ${topCareer}`),
      external: true,
      accent: "cluster",
    });
  }

  if (topMajor) {
    steps.push({
      kind: "next-step",
      id: "step-research-major",
      label: t("home.explore.title"),
      title: t("home.feed.step.research_major.title").replace("{major}", topMajor),
      body: t("home.feed.step.research_major.body"),
      cta: t("home.feed.step.research_major.cta"),
      href: youtubeSearchUrl(`what is it like studying ${topMajor}`),
      external: true,
      accent: "violet",
    });
  }

  steps.push({
    kind: "next-step",
    id: "step-tiny-project",
    label: t("home.feed.step.tiny_project.label"),
    title: t("home.feed.step.tiny_project.title").replace("{cluster}", cluster),
    body: t("home.feed.step.tiny_project.body"),
    cta: t("home.feed.step.tiny_project.cta"),
    href: "/kai",
    accent: "cluster",
  });

  steps.push({
    kind: "next-step",
    id: "step-ask-kai",
    label: t("home.feed.step.ask_kai.label"),
    title: t("home.feed.step.ask_kai.title"),
    body: t("home.feed.step.ask_kai.body").replace("{cluster}", cluster),
    cta: t("home.feed.step.ask_kai.cta"),
    href: "/kai",
    accent: "gold",
  });

  return steps;
}

/** Career spotlights — one career family per card, with a why-it-fits line. */
function buildSpotlightPool(report: PersonalizedCompassReport, t: Translate): SpotlightCard[] {
  const cluster = getClusterLabel(report.clusterCode, t);
  const driver = report.primaryDriver.toLowerCase();
  return report.careerExamples.slice(0, 6).map((career, i) => ({
    kind: "spotlight",
    id: `spotlight-${i}`,
    career,
    why: t("home.feed.spotlight.why").replace("{cluster}", cluster).replace("{driver}", driver),
    watchHref: youtubeSearchUrl(`day in the life of ${career}`),
  }));
}

/** Insight cards — read back the work-style + reward signals. */
function buildInsightPool(report: PersonalizedCompassReport, t: Translate): InsightCard[] {
  const cluster = getClusterLabel(report.clusterCode, t);
  const insights: InsightCard[] = [
    {
      kind: "insight",
      id: "insight-reward",
      eyebrow: t("home.feed.insight.reward_eyebrow"),
      title: report.primaryDriver,
      body: t("home.feed.insight.reward_body").replace("{cluster}", cluster),
    },
    {
      kind: "insight",
      id: "insight-style",
      eyebrow: t("home.feed.insight.style_eyebrow"),
      title: report.archetype,
      body: t("home.feed.insight.style_body"),
    },
    {
      kind: "insight",
      id: "insight-ecosystem",
      eyebrow: t("home.feed.insight.ecosystem_eyebrow"),
      title: report.ecosystemFit,
      body: t("home.feed.insight.ecosystem_body"),
    },
  ];
  return insights;
}

// ---------- Assembly ----------

/**
 * Assemble the ordered Compass Feed. Content-forward (fresh spark first),
 * with the progress/unlock spine and identity insights threaded in. The
 * `seed` rotates which pool item leads each slot so the feed stays fresh.
 */
export function buildHomeFeed({
  report,
  seed,
  progress,
  nextModule,
  proactiveMoment,
  t,
}: BuildHomeFeedInput): HomeFeedCard[] {
  const sparks = rotate(buildSparkPool(report, t), seed);
  const steps = rotate(buildNextStepPool(report, t), seed);
  const spotlights = rotate(buildSpotlightPool(report, t), seed);
  const insights = rotate(buildInsightPool(report, t), seed);

  const feed: HomeFeedCard[] = [];

  // 1 · Soft daily beat
  if (sparks[0]) feed.push(sparks[0]);

  // 2 · One clear next step
  if (steps[0]) feed.push(steps[0]);

  // 3 · Career spotlight
  if (spotlights[0]) feed.push(spotlights[0]);

  // 4 · Progress / unlock spine
  if (nextModule) {
    feed.push({
      kind: "unlock",
      id: "unlock-next",
      moduleName: nextModule.name,
      tagline: nextModule.tagline,
      durationLabel: nextModule.durationLabel,
      completionPct: progress.completionPct,
      completedCount: progress.completedCount,
      totalCount: progress.totalCount,
    });
  }

  // 5 · Identity insight
  if (insights[0]) feed.push(insights[0]);

  // 6 · Ask Kai — Kai's real recommended move when there is one, else a
  // generic opener, plus the rest of the profile-derived starters as
  // additional tappable prompts (never duplicating the lead one).
  const starterPrompts = buildKaiStarterPrompts(report, t);
  const leadPrompt = proactiveMoment?.text ?? starterPrompts[0] ?? "";
  feed.push({
    kind: "ask-kai",
    id: "ask-kai",
    prompt: leadPrompt,
    href: proactiveMoment?.href,
    morePrompts: starterPrompts.filter((p) => p !== leadPrompt),
    focusLine: t("home.feed.ask_kai_focus").replace(
      "{paths}",
      getClusterLabel(report.clusterCode, t),
    ),
  });

  // 7 · A second spotlight to reward scrolling
  if (spotlights[1]) feed.push(spotlights[1]);

  // 8 · Non-obvious intersections
  if (report.nonObviousPaths.length > 0) {
    feed.push({
      kind: "intersection",
      id: "intersection",
      title: report.isMultiCurious
        ? t("home.feed.intersection.multi_curious")
        : t("home.feed.intersection.less_obvious"),
      paths: report.nonObviousPaths.slice(0, 6),
    });
  }

  // 9 · A second insight
  if (insights[1]) feed.push(insights[1]);

  return feed;
}
