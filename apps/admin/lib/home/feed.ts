import { CLUSTER_VISUALS } from "@/lib/results/cluster-visuals";
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
 * Because the builder is a pure function of (report, seed), swapping the
 * pool source is a localized change.
 */

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
function buildSparkPool(report: PersonalizedCompassReport): TodayCard[] {
  const cluster = CLUSTER_VISUALS[report.clusterCode].label;
  const driver = report.primaryDriver.toLowerCase();
  return [
    {
      kind: "today",
      id: "spark-curiosity",
      eyebrow: "Today's spark",
      title: "Curiosity beats certainty.",
      body: `Only about 27% of graduates work in a field tied to their major. Your compass points toward ${cluster} — but it's a direction to test, not a verdict.`,
      source: "Federal Reserve Bank of New York",
    },
    {
      kind: "today",
      id: "spark-reward",
      eyebrow: "A nudge from Kai",
      title: `Chase what rewards you.`,
      body: `Your strongest reward signal is ${driver}. When a path looks shiny, ask one question first: would it actually give me that?`,
    },
    {
      kind: "today",
      id: "spark-region",
      eyebrow: "Did you know?",
      title: "Your generation is building the region.",
      body: "MENA will add about 127 million new workers by 2035. The paths you explore now help shape what work looks like here.",
      source: "World Bank, 2024",
    },
    {
      kind: "today",
      id: "spark-intersections",
      eyebrow: "Today's spark",
      title: "The best paths sit between fields.",
      body: `Some of the strongest careers blend ${cluster} with something unexpected. Keep one eye on the intersections, not just the obvious lane.`,
    },
    {
      kind: "today",
      id: "spark-softskills",
      eyebrow: "A nudge from Kai",
      title: "Being human is a competitive edge.",
      body: "Most young workers now say soft skills matter more in the age of AI. How you work with people is part of your compass too.",
      source: "Deloitte Gen Z Survey 2025",
    },
  ];
}

/** A rotating pool of single, concrete next actions. */
function buildNextStepPool(report: PersonalizedCompassReport): NextStepCard[] {
  const cluster = CLUSTER_VISUALS[report.clusterCode].label;
  const topCareer = report.careerExamples[0];
  const topMajor = report.universityMajors[0];
  const steps: NextStepCard[] = [];

  if (topCareer) {
    steps.push({
      kind: "next-step",
      id: "step-watch-career",
      label: "This week",
      title: `See a day in the life of a ${topCareer}`,
      body: "Ten minutes of watching beats hours of guessing. Notice what looks fun — and what doesn't.",
      cta: "Watch on YouTube",
      href: youtubeSearchUrl(`day in the life of ${topCareer}`),
      external: true,
      accent: "cluster",
    });
  }

  if (topMajor) {
    steps.push({
      kind: "next-step",
      id: "step-research-major",
      label: "Explore",
      title: `Find out what studying ${topMajor} is really like`,
      body: "Modules, workload, what graduates actually do. Make the major concrete before it's a decision.",
      cta: "Look it up",
      href: youtubeSearchUrl(`what is it like studying ${topMajor}`),
      external: true,
      accent: "violet",
    });
  }

  steps.push({
    kind: "next-step",
    id: "step-tiny-project",
    label: "Try it",
    title: `Spend 30 minutes on a tiny ${cluster} project`,
    body: "Curiosity is a muscle. A small hands-on try tells you more than any quiz about whether this lane fits.",
    cta: "Ask Kai for an idea",
    href: "/kai",
    accent: "cluster",
  });

  steps.push({
    kind: "next-step",
    id: "step-ask-kai",
    label: "Talk it through",
    title: "Stuck on where to start?",
    body: `Kai knows your compass. Ask how someone wired like you usually gets into ${cluster}.`,
    cta: "Open Kai",
    href: "/kai",
    accent: "gold",
  });

  return steps;
}

/** Career spotlights — one career family per card, with a why-it-fits line. */
function buildSpotlightPool(report: PersonalizedCompassReport): SpotlightCard[] {
  const cluster = CLUSTER_VISUALS[report.clusterCode].label;
  const driver = report.primaryDriver.toLowerCase();
  return report.careerExamples.slice(0, 6).map((career, i) => ({
    kind: "spotlight",
    id: `spotlight-${i}`,
    career,
    why: `A ${cluster} path that tends to reward ${driver} — worth a closer look before you commit to a subject route.`,
    watchHref: youtubeSearchUrl(`day in the life of ${career}`),
  }));
}

/** Insight cards — read back the work-style + reward signals. */
function buildInsightPool(report: PersonalizedCompassReport): InsightCard[] {
  const cluster = CLUSTER_VISUALS[report.clusterCode].label;
  const insights: InsightCard[] = [
    {
      kind: "insight",
      id: "insight-reward",
      eyebrow: "Your reward signal",
      title: report.primaryDriver,
      body: `This is what makes a path worth staying with. Use it as a filter: does this ${cluster} option actually feed it?`,
    },
    {
      kind: "insight",
      id: "insight-style",
      eyebrow: "How you work",
      title: report.archetype,
      body: "This is the rhythm that tends to feel natural to you day-to-day. Look for environments that match it, not fight it.",
    },
    {
      kind: "insight",
      id: "insight-ecosystem",
      eyebrow: "Where you thrive",
      title: report.ecosystemFit,
      body: "Team shape, independence, and energy level. It's a quiet but powerful way to compare schools, internships, and first jobs.",
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
}: BuildHomeFeedInput): HomeFeedCard[] {
  const sparks = rotate(buildSparkPool(report), seed);
  const steps = rotate(buildNextStepPool(report), seed);
  const spotlights = rotate(buildSpotlightPool(report), seed);
  const insights = rotate(buildInsightPool(report), seed);

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

  // 6 · Ask Kai
  feed.push({
    kind: "ask-kai",
    id: "ask-kai",
    prompt: `How do I get started exploring ${
      CLUSTER_VISUALS[report.clusterCode].label
    }?`,
  });

  // 7 · A second spotlight to reward scrolling
  if (spotlights[1]) feed.push(spotlights[1]);

  // 8 · Non-obvious intersections
  if (report.nonObviousPaths.length > 0) {
    feed.push({
      kind: "intersection",
      id: "intersection",
      title: report.isMultiCurious
        ? "Your signals point between fields"
        : "Less obvious paths worth a look",
      paths: report.nonObviousPaths.slice(0, 6),
    });
  }

  // 9 · A second insight
  if (insights[1]) feed.push(insights[1]);

  return feed;
}
