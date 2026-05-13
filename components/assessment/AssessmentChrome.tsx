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

  const snapshot = hasQuestion
    ? buildCompassSnapshot({
        questions: assessmentQuestions,
        completedCount: questionIndex,
        activeIndex: questionIndex,
      })
    : null;

  const activeQuestion = hasQuestion ? assessmentQuestions[questionIndex] : null;
  const pillarLabel = activeQuestion ? getPillarLabel(activeQuestion) : null;

  return (
    <main className="surface-night relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-5 px-5 pb-6 pt-[max(env(safe-area-inset-top),1.25rem)] text-sand">
      <div className="absolute inset-0 bg-night-stars opacity-50 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="inline-flex size-10 items-center justify-center rounded-full bg-sand/8 text-sand transition hover:bg-sand/14 active:scale-95"
          >
            <TareeqArrowLeft size={16} className="flip-rtl" />
          </button>

          {hasQuestion && snapshot ? (
            <div className="flex items-center gap-2.5">
              <CompassProgress
                snapshot={snapshot}
                size={48}
                layout="bare"
                surface="dark"
              />
              <p className="text-eyebrow tabular-nums text-sand/60">
                <span className="text-gold">
                  {String(questionIndex + 1).padStart(2, "0")}
                </span>
                <span className="text-sand/35"> / {totalQuestions}</span>
              </p>
            </div>
          ) : null}
        </div>

        {/* Tareeq mark */}
        <Link
          href="/"
          aria-label="Tareeq home"
          className="inline-flex items-center gap-1.5"
        >
          <span
            aria-hidden="true"
            className="inline-block size-7 bg-aurora"
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
          <span className="text-[18px] font-bold leading-none tracking-[-0.025em] text-sand lowercase">
            tareeq
          </span>
        </Link>
      </header>

      {hasQuestion && pillarLabel ? (
        <p className="relative z-10 text-eyebrow text-sand/55" aria-live="polite">
          {pillarLabel}
        </p>
      ) : null}

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </main>
  );
}
