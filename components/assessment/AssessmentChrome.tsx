"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { TareeqArrowLeft } from "@/components/brand/icons";
import { CompassProgress } from "@/components/brand/CompassProgress";
import { uiSounds } from "@/lib/audio/ui-sounds";
import {
  assessmentQuestions,
  getQuestionPath,
} from "@/lib/assessment/questions";
import {
  buildCompassSnapshot,
  COMPASS_PILLARS,
  PILLAR_META,
  type CompassSnapshot,
} from "@/lib/assessment/pillar-progress";
import { useAnimatedSnapshot } from "@/lib/assessment/use-animated-snapshot";

interface AssessmentChromeProps {
  children: ReactNode;
  totalQuestions: number;
}

function getIndexFromPathname(pathname: string) {
  const match = /^\/q\/(\d+)$/.exec(pathname);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

/**
 * AssessmentChrome v2 — night surface for the entire flow.
 *
 * Header layout:
 *   /start, /intro, /contract   →  [back]                [tareeq mark]
 *   /q/[index]                  →  [back] [readable compass panel]
 */
export function AssessmentChrome({
  children,
  totalQuestions,
}: AssessmentChromeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const questionIndex = getIndexFromPathname(pathname);
  const hasQuestion = questionIndex !== null;
  // Ceremonial screens — Meet Kai and the Contract — get a larger,
  // centered Tareeq mark with the warm-gradient icon.
  const isCeremony = pathname === "/intro" || pathname === "/contract";

  function goBack() {
    uiSounds.back();
    if (pathname === "/contract") {
      router.push("/intro");
      return;
    }
    if (pathname === "/intro") {
      router.push("/start");
      return;
    }
    if (!hasQuestion) {
      router.push("/");
      return;
    }
    router.push(
      questionIndex > 0 ? getQuestionPath(questionIndex - 1) : "/contract",
    );
  }

  // Always build a snapshot so the animation hook has stable inputs.
  // When no question is active we feed an empty snapshot — the compass
  // simply isn't rendered, but the hook keeps a consistent call site.
  const rawSnapshot = buildCompassSnapshot({
    questions: assessmentQuestions,
    completedCount: hasQuestion ? questionIndex : 0,
    activeIndex: hasQuestion ? questionIndex : null,
  });
  const snapshot = useAnimatedSnapshot(rawSnapshot);

  return (
    <main className="surface-night relative mx-auto flex h-dvh w-full max-w-[480px] flex-col gap-3 overflow-hidden px-5 pb-4 pt-[max(env(safe-area-inset-top),0.875rem)] text-sand">
      <div className="absolute inset-0 bg-night-stars opacity-80 pointer-events-none" />

      {/* Header
       *
       * Two layouts:
       *  · question screens (/q/*) — back-button left, readable compass panel
       *  · everywhere else        — back-button + counter left, Tareeq mark right
       *                              (mark goes centered+warm-gradient on ceremony screens)
       */}
      <header
        className={
          hasQuestion
            ? "relative z-10 grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-2"
            : "relative z-10 flex h-10 items-center justify-between gap-2"
        }
      >
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className={`glass-tile inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sand transition hover:text-sand active:scale-95 ${
            hasQuestion ? "mt-1" : ""
          }`}
        >
          <TareeqArrowLeft size={15} className="flip-rtl" />
        </button>

        {hasQuestion ? (
          <QuestionCompassPanel
            snapshot={snapshot}
            questionIndex={questionIndex}
            totalQuestions={totalQuestions}
          />
        ) : (
          /* Tareeq mark — centered + warm-gradient on ceremony screens, right on others */
          <Link
            href="/"
            aria-label="Tareeq home"
            className={
              isCeremony
                ? "absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
                : "inline-flex items-center gap-1.5"
            }
          >
            <span
              aria-hidden="true"
              className={`inline-block ${
                isCeremony ? "size-8 bg-grad-warm" : "size-6 bg-aurora"
              }`}
              style={{
                WebkitMaskImage: "url('/logo/tareeq-mark.svg')",
                maskImage: "url('/logo/tareeq-mark.svg')",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
            <span
              className={`font-bold leading-none tracking-[-0.025em] text-sand lowercase ${
                isCeremony ? "text-[20px]" : "text-[16px]"
              }`}
            >
              tareeq
            </span>
          </Link>
        )}
      </header>

      {/* Scrollable content well — the chrome locks to the viewport, but
       *  inner content can overflow vertically on short phones (iPhone SE,
       *  landscape, etc.) and scroll. `overscroll-contain` keeps the rubber
       *  band inside the well so the body never bounces. */}
      <div className="relative z-10 flex flex-1 flex-col min-h-0 -mx-5 overflow-y-auto overscroll-contain px-5 pb-1">
        {children}
      </div>
    </main>
  );
}

interface QuestionCompassPanelProps {
  snapshot: CompassSnapshot;
  questionIndex: number;
  totalQuestions: number;
}

function QuestionCompassPanel({
  snapshot,
  questionIndex,
  totalQuestions,
}: QuestionCompassPanelProps) {
  const activeMeta = snapshot.activePillar
    ? PILLAR_META[snapshot.activePillar]
    : null;

  return (
    <section
      className="min-w-0 rounded-[20px] border border-sand/10 bg-sand/[0.075] px-2.5 py-2 shadow-[0_14px_34px_rgba(0,0,0,0.24)] backdrop-blur-md"
      aria-label="CORE compass progress"
      aria-live="polite"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="shrink-0 rounded-full bg-night/35 p-1 shadow-inner shadow-black/20">
          <CompassProgress
            snapshot={snapshot}
            size={58}
            layout="bare"
            surface="dark"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sand/45">
              Compass
            </p>
            <p className="shrink-0 text-[11px] font-semibold tabular-nums text-sand/55">
              {String(questionIndex + 1).padStart(2, "0")} / {totalQuestions}
            </p>
          </div>

          <p className="mt-0.5 truncate text-[15px] font-semibold leading-tight text-sand">
            {activeMeta ? activeMeta.name : "About you"}
          </p>
          <p className="mt-0.5 truncate text-[11px] leading-snug text-sand/58">
            {activeMeta ? activeMeta.blurb : "Setting your starting point"}
          </p>

          <div className="mt-1.5 grid grid-cols-4 gap-1">
            {COMPASS_PILLARS.map((pillar) => {
              const meta = PILLAR_META[pillar];
              const value = snapshot.byPillar[pillar];
              const percent = Math.round(value * 100);
              const isActive = snapshot.activePillar === pillar;

              return (
                <div
                  key={pillar}
                  className={`min-w-0 rounded-full border px-1.5 py-1 ${
                    isActive
                      ? "border-coral/55 bg-coral/15"
                      : "border-sand/10 bg-sand/[0.045]"
                  }`}
                  aria-label={`${meta.name}: ${percent} percent complete`}
                >
                  <span
                    className={`block text-[10px] font-bold leading-none ${
                      isActive ? "text-coral" : "text-sand/68"
                    }`}
                  >
                    {meta.letter}
                  </span>
                  <span className="mt-1 block h-0.5 overflow-hidden rounded-full bg-sand/14">
                    <span
                      className="block h-full rounded-full bg-grad-warm"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
