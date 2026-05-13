"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Kai } from "@/components/brand/Kai";
import { KaiAuraV2 } from "@/components/brand/KaiAuraV2";
import { uiSounds } from "@/lib/audio/ui-sounds";
import {
  answeredQuestionCount,
  createLocalAssessment,
  getResumeQuestionIndex,
  readLocalAssessment,
  resetLocalAssessment,
  type LocalAssessmentProgress,
  writeLocalAssessment,
} from "@/lib/assessment/progress";
import { getQuestionPath } from "@/lib/assessment/questions";

interface AssessmentStartProps {
  totalQuestions: number;
}

const STEPS = [
  { n: 1, title: "Take the assessment", meta: "12 min · 54 questions" },
  { n: 2, title: "Meet your Compass", meta: "Persona + four pillars" },
  { n: 3, title: "Walk the path with us", meta: "Mentors + community" },
] as const;

export function AssessmentStart({ totalQuestions }: AssessmentStartProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<LocalAssessmentProgress | null>(
    null,
  );

  useEffect(() => {
    setProgress(readLocalAssessment());
  }, []);

  const answeredCount = answeredQuestionCount(progress);
  const canResume = answeredCount > 0 && !progress?.completedAt;
  const completed =
    searchParams.get("complete") === "1" || Boolean(progress?.completedAt);

  const resumeAt = useMemo(() => {
    if (!progress) return null;
    return Math.min(
      getResumeQuestionIndex(progress, totalQuestions) + 1,
      totalQuestions,
    );
  }, [progress, totalQuestions]);

  function startFresh() {
    uiSounds.advance();
    resetLocalAssessment();
    writeLocalAssessment(createLocalAssessment());
    router.push("/intro");
  }

  function resume() {
    uiSounds.advance();
    router.push(
      getQuestionPath(getResumeQuestionIndex(progress, totalQuestions)),
    );
  }

  return (
    <section
      aria-labelledby="start-heading"
      className="anim-screen-enter flex flex-1 flex-col gap-7 pb-4"
    >
      {/* Eyebrow chip */}
      <span className="anim-eyebrow-fade-up chip chip--violet-on-dark w-fit">
        <span className="size-1.5 rounded-full bg-gold" />A career compass
      </span>

      {/* Editorial hero headline */}
      <h1 id="start-heading" className="text-hero text-sand">
        Find the work
        <br />
        that&rsquo;s been{" "}
        <span
          className="text-gold"
          style={{
            fontStyle: "italic",
            fontVariationSettings: '"SOFT" 100, "opsz" 144',
          }}
        >
          waiting
        </span>{" "}
        for you.
      </h1>

      {/* Hero illustration — aurora + Kai */}
      <div className="relative mx-auto flex h-[260px] w-[260px] items-center justify-center">
        <div className="anim-aura-bloom absolute inset-0">
          <KaiAuraV2 size="100%" />
        </div>
        <div
          aria-label="Kai, your guide"
          role="img"
          className="anim-kai-pop relative"
          style={{ animationDelay: "260ms" }}
        >
          <div className="anim-avatar-bob" style={{ animationDelay: "1100ms" }}>
            <Kai mood="warm" size={172} />
          </div>
        </div>
      </div>

      {/* Resume / complete banners */}
      {canResume && resumeAt ? (
        <div
          role="status"
          aria-live="polite"
          className="anim-bubble-in card-night flex items-center justify-between gap-3 !py-3"
        >
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-gold" />
            <p className="text-body-sm leading-5 text-sand">
              On question{" "}
              <span className="font-semibold tabular-nums">{resumeAt}</span>
              <span className="text-sand/55"> of {totalQuestions}</span>
            </p>
          </div>
          <button
            type="button"
            className="btn-v2 btn-v2--ghost-on-dark"
            data-size="sm"
            onClick={resume}
          >
            Resume →
          </button>
        </div>
      ) : null}

      {completed ? (
        <div
          role="status"
          aria-live="polite"
          className="anim-bubble-in card-night flex items-center gap-2.5"
          style={{ borderColor: "rgba(244, 198, 96, 0.4)" }}
        >
          <span className="size-2 rounded-full bg-gold" />
          <p className="text-body-sm leading-5 text-sand">
            Your Compass is saved on this device.
          </p>
        </div>
      ) : null}

      {/* Step ladder */}
      <ol className="relative grid gap-4 ps-1">
        <span
          aria-hidden="true"
          className="absolute start-[15px] top-5 bottom-5 w-px bg-gradient-to-b from-violet-soft/40 via-violet-soft/20 to-gold/40"
        />
        {STEPS.map((step, i) => (
          <li
            key={step.n}
            className="anim-option-in relative grid grid-cols-[32px_1fr] items-center gap-4"
            style={{ animationDelay: `${320 + i * 90}ms` }}
          >
            <span className="relative z-10 grid size-8 place-items-center rounded-full bg-violet/15 text-sand text-[13px] font-bold ring-1 ring-violet-soft/30">
              {step.n}
            </span>
            <div>
              <p className="text-body font-semibold text-sand">{step.title}</p>
              <p className="text-body-sm text-sand/55">{step.meta}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex-1" />

      {/* Primary CTA */}
      <div className="grid gap-3">
        <button
          type="button"
          onClick={canResume ? resume : startFresh}
          className="btn-v2 btn-v2--primary w-full"
          data-size="lg"
        >
          {canResume ? `Resume at ${resumeAt} of ${totalQuestions}` : "Begin"}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {canResume ? (
          <button
            type="button"
            onClick={startFresh}
            className="btn-v2 btn-v2--ghost-on-dark w-full"
            data-size="md"
          >
            Start over
          </button>
        ) : null}

        <p className="text-center text-eyebrow text-sand/45">
          ~12 min · Free · Stays on your device
        </p>
      </div>
    </section>
  );
}
