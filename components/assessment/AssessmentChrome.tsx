"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { TareeqArrowLeft } from "@/components/brand/icons";
import { CompassProgress } from "@/components/brand/CompassProgress";
import { uiSounds } from "@/lib/audio/ui-sounds";
import {
  assessmentQuestions,
  getPillarLabel,
  getQuestionPath,
} from "@/lib/assessment/questions";
import { buildCompassSnapshot } from "@/lib/assessment/pillar-progress";
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
 *   /q/[index]                  →  [back] [compass] [n/total]   [mark]
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

  const activeQuestion = hasQuestion ? assessmentQuestions[questionIndex] : null;
  const pillarLabel = activeQuestion ? getPillarLabel(activeQuestion) : null;

  return (
    <main className="surface-night relative mx-auto flex h-dvh w-full max-w-[480px] flex-col gap-3 overflow-hidden px-5 pb-4 pt-[max(env(safe-area-inset-top),0.875rem)] text-sand">
      <div className="absolute inset-0 bg-night-stars opacity-80 pointer-events-none" />

      {/* Header
       *
       * Two layouts:
       *  · question screens (/q/*) — back-button left, big compass centered, no logo
       *  · everywhere else        — back-button + counter left, Tareeq mark right
       *                              (mark goes centered+warm-gradient on ceremony screens)
       */}
      <header
        className={`relative z-10 flex items-center justify-between gap-2 ${
          hasQuestion ? "h-14" : "h-10"
        }`}
      >
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="glass-tile inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sand transition hover:text-sand active:scale-95"
        >
          <TareeqArrowLeft size={15} className="flip-rtl" />
        </button>

        {hasQuestion ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <CompassProgress
              snapshot={snapshot}
              size={56}
              layout="bare"
              surface="dark"
            />
          </div>
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

        {/* Right-hand spacer to balance the back button when no logo renders. */}
        {hasQuestion ? (
          <span aria-hidden="true" className="size-9 shrink-0" />
        ) : null}
      </header>

      {hasQuestion && pillarLabel ? (
        <p
          className="relative z-10 -mt-1 text-center text-eyebrow text-sand/65"
          aria-live="polite"
        >
          <span className="text-sand/85">{pillarLabel}</span>
          <span className="text-sand/30"> · </span>
          <span className="tabular-nums">
            <span className="text-grad-warm font-semibold">
              {String(questionIndex + 1).padStart(2, "0")}
            </span>
            <span className="text-sand/40"> / {totalQuestions}</span>
          </span>
        </p>
      ) : null}

      <div className="relative z-10 flex flex-1 flex-col min-h-0">{children}</div>
    </main>
  );
}
