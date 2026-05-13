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

export function AssessmentChrome({
  children,
  totalQuestions,
}: AssessmentChromeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const questionIndex = getIndexFromPathname(pathname);
  const hasQuestion = questionIndex !== null;
  const isLight = hasQuestion; // /q/* uses light mode
  const isNight = pathname === "/intro"; // v2 mystical redesign surface

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
    // First question goes back to the contract so users can re-read it
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

  const lightBg =
    "radial-gradient(60% 50% at 80% 0%, rgba(255,107,71,0.10), transparent 60%), " +
    "radial-gradient(50% 40% at 15% 100%, rgba(184,165,217,0.18), transparent 65%), " +
    "var(--cream)";

  return (
    <main
      className={[
        "relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pb-6",
        // Tighter top padding on question screens so the compass sits up high
        hasQuestion
          ? "gap-3 pt-[max(env(safe-area-inset-top),0.75rem)]"
          : "gap-5 pt-[max(env(safe-area-inset-top),1.5rem)]",
        isLight
          ? "text-ink"
          : isNight
            ? "surface-night text-sand"
            : "surface-plum text-cream",
      ].join(" ")}
      style={isLight ? { background: lightBg } : undefined}
    >
      {/* Top row — back left, compass centered on the same row (questions),
       *  or back + logo cluster (start). Frees vertical space for the body. */}
      {hasQuestion && snapshot ? (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="justify-self-start">
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className={[
                "inline-flex size-9 items-center justify-center rounded-md transition active:scale-95",
                isLight
                  ? "border border-ink/10 bg-white/70 text-ink hover:bg-white hover:border-ink/20"
                  : "border border-white/15 bg-white/5 text-cream hover:bg-white/10",
              ].join(" ")}
            >
              <TareeqArrowLeft size={16} className="flip-rtl" />
            </button>
          </div>

          <div className="justify-self-center">
            <CompassProgress
              snapshot={snapshot}
              size={56}
              layout="bare"
              surface={isLight ? "light" : "dark"}
            />
          </div>

          <div className="justify-self-end" />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className={[
                "inline-flex size-9 items-center justify-center rounded-md transition active:scale-95",
                isLight
                  ? "border border-ink/10 bg-white/70 text-ink hover:bg-white hover:border-ink/20"
                  : "border border-white/15 bg-white/5 text-cream hover:bg-white/10",
              ].join(" ")}
            >
              <TareeqArrowLeft size={16} className="flip-rtl" />
            </button>

            <Link
              href="/"
              aria-label="Tareeq home"
              className="inline-flex items-center gap-1.5"
            >
              <span
                aria-hidden="true"
                className="inline-block size-6 bg-grad-warm"
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
                className={[
                  "text-[18px] font-bold leading-none tracking-[-0.025em] lowercase",
                  isLight ? "text-ink" : "text-cream",
                ].join(" ")}
              >
                tareeq
              </span>
            </Link>
          </div>
          <div />
        </div>
      )}

      {/* Pillar caption — single line, centered, sits just below the header */}
      {hasQuestion ? (
        <p
          className={[
            "text-caption text-center",
            isLight ? "text-ink/55" : "text-cream/55",
          ].join(" ")}
          aria-live="polite"
        >
          Pillar ·{" "}
          <span className={isLight ? "text-ink/85" : "text-cream/85"}>
            {pillarLabel}
          </span>
          <span
            className={[
              "ms-2 tabular-nums",
              isLight ? "text-ink/35" : "text-cream/35",
            ].join(" ")}
          >
            <span className="text-coral">
              {String(questionIndex + 1).padStart(2, "0")}
            </span>
            /{totalQuestions}
          </span>
        </p>
      ) : null}

      {children}
    </main>
  );
}
