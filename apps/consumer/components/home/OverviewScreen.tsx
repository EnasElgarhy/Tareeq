"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CompassScene,
  CommunityScene,
  PersonaScene,
} from "@/components/brand/Illustrations";
import {
  CrossingPathsScene,
  DualWaysScene,
  PatternEmergingScene,
  PeakReachedScene,
} from "@/components/brand/InterstitialScenes";
import { AchievementsCard } from "@/components/home/AchievementsCard";
import { APP_ACCENT } from "@/components/home/app-accent";
import { CareerTile } from "@/components/home/CareerTile";
import { CollectionTile } from "@/components/home/CollectionTile";
import { CompassHero } from "@/components/home/CompassHero";
import { FeedCardView } from "@/components/home/FeedCards";
import { FeedCarousel } from "@/components/home/FeedCarousel";
import { NoCompassEmptyState } from "@/components/home/NoCompassEmptyState";
import { ProgressRingCard } from "@/components/home/ProgressRingCard";
import { StreakCard } from "@/components/home/StreakCard";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { buildHomeFeed, type NextLockedModule } from "@/lib/home/feed";
import { readActiveConversation } from "@/lib/kai/chat-storage";
import type { KaiConversation } from "@/lib/kai/chat-types";
import { buildKaiContext } from "@/lib/kai/context";
import { readMemory } from "@/lib/kai/memory/memory";
import type { KaiMemoryProfile } from "@/lib/kai/memory/memory-types";
import { daysSince, markSeenNow, readLastSeenAt } from "@/lib/kai/proactive/last-seen";
import { buildProactiveContext } from "@/lib/kai/proactive/proactive-context";
import { proactiveMomentHref, renderProactiveMomentText } from "@/lib/kai/proactive/proactive-render";
import { deriveAchievements } from "@/lib/profile/activity";
import { readProfileSnapshot, type ProfileSnapshot } from "@/lib/profile/journey";
import { computeStreak, recordVisitToday } from "@/lib/profile/streak";
import { CLUSTER_VISUALS, getClusterLabel, getClusterTagline } from "@/lib/results/cluster-visuals";
import { getConfidenceLabelKey } from "@/lib/results/report-labels";
import type { ClusterCode } from "@/lib/scoring";

const MS_PER_DAY = 86_400_000;

// Monochrome line scenes for the colored collection tiles; colorful spot
// scenes for the light career tiles.
const COLLECTION_SCENES = [
  PatternEmergingScene,
  CrossingPathsScene,
  DualWaysScene,
  PeakReachedScene,
];
const CAREER_SCENES = [CompassScene, PersonaScene, CommunityScene];

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return (
    (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")
  ).toUpperCase();
}

function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query,
  )}`;
}

/**
 * Overview — the visual "Compass Feed". A bold cluster-colored hero,
 * illustrated career + curiosity carousels, a journey progress gauge, and
 * a guide who knows the user — all on the warm-paper light surface.
 */
export function OverviewScreen() {
  const { locale, t } = useLocale();
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const [seed, setSeed] = useState(0);
  const [memory, setMemory] = useState<KaiMemoryProfile | null>(null);
  const [conversation, setConversation] = useState<KaiConversation | null>(null);
  const [daysSinceLastSeen, setDaysSinceLastSeen] = useState<number | null>(null);
  const [visitDates, setVisitDates] = useState<string[]>([]);

  useEffect(() => {
    setSnapshot(readProfileSnapshot());
    setSeed(Math.floor(new Date().getTime() / MS_PER_DAY));
    setConversation(readActiveConversation());
    // Read the PRIOR last-seen value before overwriting it with "now" —
    // otherwise the inactivity nudge would always compare "now" to "now".
    setDaysSinceLastSeen(daysSince(readLastSeenAt(), new Date()));
    markSeenNow();
    // "Any app visit counts as a streak day" — the simplest rule, and
    // idempotent (recordVisitToday() is a no-op if today's already logged).
    setVisitDates(recordVisitToday());
    void readMemory().then(setMemory);
    setReady(true);
  }, []);

  const report = snapshot?.coreReport ?? null;

  const nextModule: NextLockedModule | null = useMemo(() => {
    const locked = snapshot?.modules.find((m) => m.status === "locked");
    return locked
      ? {
          name: locked.name,
          tagline: locked.tagline,
          durationLabel: locked.durationLabel,
        }
      : null;
  }, [snapshot]);

  const kaiContext = useMemo(
    () =>
      snapshot
        ? buildKaiContext({ displayName: snapshot.registration?.name ?? "", locale, snapshot })
        : null,
    [snapshot, locale],
  );

  const proactiveContext = useMemo(
    () =>
      snapshot && memory && kaiContext
        ? buildProactiveContext({ now: new Date(), kaiContext, snapshot, memory, conversation, daysSinceLastSeen })
        : null,
    [snapshot, memory, kaiContext, conversation, daysSinceLastSeen],
  );

  // "compass_highlight" reads back a fact the insight cards below already
  // surface (driver/archetype/ecosystem) — only the other moment kinds
  // (resume a conversation, follow up a remembered topic, take the next
  // step) are genuinely new information worth leading the Ask Kai card.
  const proactiveMomentForFeed = useMemo(() => {
    const moment = proactiveContext?.primaryMoment;
    if (!moment || moment.kind === "compass_highlight") return null;
    // proactiveMomentHref() targets /kai-chat, the old pill-tab surface's
    // chat route — from Home (the new bottom-tab shell) the same chat
    // experience lives at /kai, so retarget rather than exit the shell.
    const href = proactiveMomentHref(moment).replace(/^\/kai-chat/, "/kai");
    return { text: renderProactiveMomentText(moment, t), href };
  }, [proactiveContext, t]);

  const feed = useMemo(() => {
    if (!report || !snapshot) return [];
    return buildHomeFeed({
      report,
      seed,
      progress: {
        completionPct: snapshot.completionPct,
        completedCount: snapshot.completedCount,
        totalCount: snapshot.totalCount,
      },
      nextModule,
      proactiveMoment: proactiveMomentForFeed,
      t,
    });
  }, [report, snapshot, seed, nextModule, proactiveMomentForFeed, t]);

  if (!ready) return null;
  if (!report || !snapshot) {
    return (
      <NoCompassEmptyState
        title={t("home.overview.empty_title")}
        description={t("home.overview.empty_description")}
      />
    );
  }

  const streak = computeStreak(visitDates, new Date());
  const achievements = deriveAchievements(snapshot, streak.badgeUnlocked);

  const fullName = snapshot.registration?.name ?? "there";
  const firstName = firstNameOf(fullName);
  const initials = snapshot.registration ? initialsOf(fullName) : "T";

  const todayCard = feed.find((c) => c.kind === "today");
  const nextStepCard = feed.find((c) => c.kind === "next-step");
  const insightCard = feed.find((c) => c.kind === "insight");
  const askKaiCard = feed.find((c) => c.kind === "ask-kai");
  const intersectionCard = feed.find((c) => c.kind === "intersection");

  const careers = report.careerExamples.slice(0, 6);
  const topClusters = report.score.clusterRanked.slice(0, 5) as Array<
    [ClusterCode, number]
  >;

  return (
    <section className="flex flex-1 flex-col gap-6 pb-5 lg:gap-7">
      <header className="daybreak-reveal flex items-center justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="daybreak-eyebrow">✦ {t("home.hero.eyebrow")}</p>
          <h1 className="daybreak-heading mt-1 text-[30px] leading-[1.05] text-[color:var(--day-ink)] sm:text-[36px]">
            {t("home.overview.greeting").replace("{name}", firstName)}
          </h1>
          {proactiveContext?.showInactivityNudge && proactiveContext.daysSinceLastSeen !== null ? (
            <p className="mt-0.5 text-[11.5px] text-[color:var(--day-ink-3)]">
              {t("profile.proactive.inactivity_nudge").replace(
                "{days}",
                String(proactiveContext.daysSinceLastSeen),
              )}
            </p>
          ) : null}
        </div>
        <Link
          href="/you"
          aria-label={t("home.overview.avatar_label")}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-[color:var(--day-line)] bg-[color:var(--day-elevated)] font-heading text-[13px] font-bold text-[color:var(--day-ink-2)] shadow-[var(--day-shadow-card)] transition active:scale-95"
        >
          {initials}
        </Link>
      </header>

      <CompassHero
        clusterLabel={getClusterLabel(report.clusterCode, t)}
        clusterColor={APP_ACCENT}
        confidenceLabel={t(getConfidenceLabelKey(report.score.confidenceLabel))}
        confidence={report.score.confidencePercentage}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.72fr)] xl:gap-7">
        <div className="grid min-w-0 gap-6">
          {careers.length > 0 ? (
            <FeedCarousel
              title={t("home.overview.paths_title")}
              subtitle={t("home.overview.paths_subtitle")}
            >
              {careers.map((career, i) => (
                <CareerTile
                  key={career}
                  career={career}
                  color={APP_ACCENT}
                  scene={CAREER_SCENES[i % CAREER_SCENES.length]}
                  watchHref={youtubeSearchUrl(`day in the life of ${career}`)}
                />
              ))}
            </FeedCarousel>
          ) : null}

          {nextStepCard ? (
            <FeedCardView
              card={nextStepCard}
              clusterColor={APP_ACCENT}
              clusterInk={APP_ACCENT}
            />
          ) : null}

          {topClusters.length > 0 ? (
            <FeedCarousel
              title={t("home.overview.clusters_title")}
              subtitle={t("home.overview.clusters_subtitle")}
            >
              {topClusters.map(([code], i) => {
                const cv = CLUSTER_VISUALS[code];
                return (
                  <CollectionTile
                    key={code}
                    label={getClusterLabel(code, t)}
                    tagline={getClusterTagline(code, t)}
                    color={cv.color}
                    ink={cv.ink}
                    scene={COLLECTION_SCENES[i % COLLECTION_SCENES.length]}
                    href="/explore"
                    rank={i + 1}
                  />
                );
              })}
            </FeedCarousel>
          ) : null}

          {todayCard ? (
            <FeedCardView
              card={todayCard}
              clusterColor={APP_ACCENT}
              clusterInk={APP_ACCENT}
            />
          ) : null}

          {insightCard ? (
            <FeedCardView
              card={insightCard}
              clusterColor={APP_ACCENT}
              clusterInk={APP_ACCENT}
            />
          ) : null}

          {intersectionCard ? (
            <FeedCardView
              card={intersectionCard}
              clusterColor={APP_ACCENT}
              clusterInk={APP_ACCENT}
            />
          ) : null}
        </div>

        <aside className="grid gap-5 md:grid-cols-2 xl:sticky xl:top-0 xl:grid-cols-1">
          {askKaiCard ? (
            <div className="md:col-span-2 xl:col-span-1">
              <FeedCardView
                card={askKaiCard}
                clusterColor={APP_ACCENT}
                clusterInk={APP_ACCENT}
              />
            </div>
          ) : null}

          <ProgressRingCard
            completionPct={snapshot.completionPct}
            completedCount={snapshot.completedCount}
            totalCount={snapshot.totalCount}
            clusterColor={APP_ACCENT}
            clusterInk={APP_ACCENT}
            moduleName={nextModule?.name ?? null}
            moduleTagline={nextModule?.tagline ?? null}
            moduleDuration={nextModule?.durationLabel ?? null}
          />

          <StreakCard streak={streak} />

          <div className="md:col-span-2 xl:col-span-1">
            <AchievementsCard achievements={achievements} />
          </div>
        </aside>
      </div>
    </section>
  );
}
