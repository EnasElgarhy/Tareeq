"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  TareeqArrowRight,
  TareeqLock,
  TareeqRotate,
  TareeqSparkle,
} from "@/components/brand/icons";
import {
  AssessIcon,
  DiscoverIcon,
  GrowIcon,
} from "@/components/brand/StepIcons";
import { CareerOrbit } from "@/components/brand/CareerOrbit";
import { Button } from "@/components/primitives/Button";
import {
  PathSteps,
  type PathStep,
} from "@/components/onboarding/PathSteps";
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

const STEPS: ReadonlyArray<PathStep> = [
  {
    n: 1,
    title: "Take the assessment",
    body: "12 minutes. 60 honest questions. Tap an answer and we keep moving.",
    icon: <AssessIcon />,
  },
  {
    n: 2,
    title: "Meet your Compass",
    body: "One persona, four pillars, and a shortlist of careers that fit how you're wired.",
    icon: <DiscoverIcon />,
  },
  {
    n: 3,
    title: "Walk the path with us",
    body: "Curated courses, mentors and a community of students on similar paths.",
    icon: <GrowIcon />,
  },
];

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
    // Fresh starts route through the Kai intro + CORE contract, then Q1.
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
      className="anim-screen-enter flex flex-1 flex-col gap-5 pb-4"
    >
      {/* Editorial headline — bold sans paired with soft italic Fraunces
       *  on the gradient accent. Magazine pull-quote energy. */}
      <header className="flex flex-col gap-2">
        <h1
          id="start-heading"
          className="max-w-[16ch] text-[clamp(1.875rem,1.2rem+2.6vw,2.375rem)] font-bold leading-[1.04] tracking-[-0.018em] text-cream"
        >
          Fast track{" "}
          <span
            className="text-grad-warm font-normal italic"
            style={{
              fontFamily: "var(--font-display-italic), Georgia, serif",
            }}
          >
            career success
          </span>
        </h1>
        <p className="max-w-[34ch] text-[14.5px] leading-relaxed text-cream/72">
          Discover yourself, unlock your future.
        </p>
      </header>

      {/* Hero — career orbit illustration with floating path tags */}
      <CareerOrbit />

      {/* The 3-step vertical ladder */}
      <PathSteps steps={STEPS} />

      {/* Resume / complete banners — only when relevant, kept tiny */}
      {canResume && resumeAt ? (
        <div
          role="status"
          aria-live="polite"
          className="anim-bubble-in flex items-center justify-between gap-3 rounded-md border border-coral/35 bg-coral/10 px-3 py-2 text-cream"
        >
          <p className="text-body-sm leading-5">
            On{" "}
            <span className="font-semibold tabular-nums">
              question {resumeAt}
            </span>
            <span className="text-cream/55"> of {totalQuestions}</span>
          </p>
          <Button
            variant="ghost-on-dark"
            size="sm"
            onClick={resume}
            iconRight={<TareeqArrowRight size={14} />}
          >
            Resume
          </Button>
        </div>
      ) : null}

      {completed ? (
        <div
          role="status"
          aria-live="polite"
          className="anim-bubble-in flex items-center gap-2 rounded-md border border-cyan-brand/40 bg-cyan-brand/12 px-3 py-2 text-cream"
        >
          <TareeqSparkle size={16} className="shrink-0 text-cyan-brand" />
          <p className="text-body-sm leading-5 text-cream/90">
            Your Compass is saved on this device.
          </p>
        </div>
      ) : null}

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTAs */}
      <div className="grid gap-2">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          onClick={canResume ? resume : startFresh}
          iconRight={<TareeqArrowRight size={20} />}
        >
          {canResume
            ? `Resume at ${resumeAt} of ${totalQuestions}`
            : "Take the assessment"}
        </Button>

        {canResume ? (
          <Button
            variant="ghost-on-dark"
            size="md"
            fullWidth
            onClick={startFresh}
            iconRight={<TareeqRotate size={14} />}
          >
            Start over
          </Button>
        ) : null}

        <p className="flex items-center justify-center gap-1.5 pt-1 text-caption text-cream/45">
          <TareeqLock size={11} />
          ~12 min · Free · Stays on your device
        </p>
      </div>
    </section>
  );
}
