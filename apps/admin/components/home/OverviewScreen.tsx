"use client";

import { ArrowRight } from "lucide-react";
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
import { APP_ACCENT, APP_ACCENT_DEEP } from "@/components/home/app-accent";
import { CareerTile } from "@/components/home/CareerTile";
import { CollectionTile } from "@/components/home/CollectionTile";
import { CompassHero } from "@/components/home/CompassHero";
import { FeedCardView } from "@/components/home/FeedCards";
import { FeedCarousel } from "@/components/home/FeedCarousel";
import { ProgressRingCard } from "@/components/home/ProgressRingCard";
import { buildHomeFeed, type NextLockedModule } from "@/lib/home/feed";
import { readProfileSnapshot, type ProfileSnapshot } from "@/lib/profile/journey";
import { CLUSTER_VISUALS } from "@/lib/results/cluster-visuals";
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
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    setSnapshot(readProfileSnapshot());
    setSeed(Math.floor(new Date().getTime() / MS_PER_DAY));
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
    });
  }, [report, snapshot, seed, nextModule]);

  if (!ready) return null;
  if (!report || !snapshot) return <EmptyState />;

  const visual = CLUSTER_VISUALS[report.clusterCode];
  const fullName = snapshot.registration?.name ?? "there";
  const firstName = firstNameOf(fullName);
  const initials = snapshot.registration ? initialsOf(fullName) : "🧭";

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
    <section className="flex flex-1 flex-col gap-5 pb-4">
      <header className="flex items-center justify-between gap-3 pt-1">
        <h1 className="text-[26px] font-black leading-tight text-[color:var(--day-ink)]">
          Hello, {firstName}
        </h1>
        <Link
          href="/you"
          aria-label="Your profile"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-[color:var(--day-line)] bg-[color:var(--day-card)] text-[13px] font-black text-[color:var(--day-ink-2)] shadow-[var(--day-shadow-card)] transition active:scale-95"
        >
          {initials}
        </Link>
      </header>

      <CompassHero
        clusterLabel={visual.label}
        clusterColor={APP_ACCENT}
        clusterInk={APP_ACCENT_DEEP}
        confidenceLabel={report.score.confidenceLabel}
        confidence={report.score.confidencePercentage}
      />

      {careers.length > 0 ? (
        <FeedCarousel
          title="Paths to explore"
          subtitle="Career families your profile may thrive in."
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
          title="Your curiosity map"
          subtitle="The signals that make up your compass — strongest first."
        >
          {topClusters.map(([code], i) => {
            const cv = CLUSTER_VISUALS[code];
            return (
              <CollectionTile
                key={code}
                label={cv.label}
                tagline={cv.tagline}
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

      {insightCard ? (
        <FeedCardView
          card={insightCard}
          clusterColor={APP_ACCENT}
          clusterInk={APP_ACCENT}
        />
      ) : null}

      {askKaiCard ? (
        <FeedCardView
          card={askKaiCard}
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
    </section>
  );
}

/** Shown when the user lands on Home without a saved compass result. */
function EmptyState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 px-2 text-center">
      <span className="grid size-16 place-items-center rounded-full border border-[color:var(--day-line)] bg-[color:var(--day-card)] text-[26px] shadow-[var(--day-shadow-card)]">
        🧭
      </span>
      <div className="grid gap-1.5">
        <h1 className="text-[22px] font-black text-[color:var(--day-ink)]">
          Your compass lives here
        </h1>
        <p className="mx-auto max-w-[32ch] text-[13.5px] leading-relaxed text-[color:var(--day-ink-2)]">
          Take the CORE Compass to unlock your personalized home — career
          directions, next steps, and a guide who knows how you&apos;re wired.
        </p>
      </div>
      <Link href="/start" className="btn-v2 btn-v2--primary" data-size="lg">
        Start your compass
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}
