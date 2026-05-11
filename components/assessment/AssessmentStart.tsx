"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

type AssessmentStartProps = {
  totalQuestions: number;
};

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
    searchParams.get("complete") === "1" || progress?.completedAt;

  const resumeLabel = useMemo(() => {
    if (!progress) return "Resume";
    return `Resume at ${Math.min(
      getResumeQuestionIndex(progress, totalQuestions) + 1,
      totalQuestions,
    )} / ${totalQuestions}`;
  }, [progress, totalQuestions]);

  function startFresh() {
    resetLocalAssessment();
    writeLocalAssessment(createLocalAssessment());
    router.push(getQuestionPath(0));
  }

  function resume() {
    router.push(
      getQuestionPath(getResumeQuestionIndex(progress, totalQuestions)),
    );
  }

  return (
    <section className="flex flex-1 flex-col justify-center pb-4 pt-2">
      <div className="mb-5 inline-flex w-max items-center gap-2 rounded-full border border-glass-border bg-glass px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-text-80">
        <span className="size-1.5 rounded-full bg-accent-orange shadow-[0_0_12px_var(--accent-orange)]" />
        CORE Assessment · v4
      </div>

      <h1 className="max-w-[12ch] font-display text-[2.55rem] font-medium leading-[1.03] tracking-normal text-text-100">
        Find the work that{" "}
        <em className="bg-grad-warm bg-clip-text font-normal italic text-transparent">
          lights you up.
        </em>
      </h1>

      <p className="mt-5 max-w-[31ch] text-[1.05rem] leading-7 text-text-80">
        Answer honestly and Kai will turn your choices into a Career Compass.
      </p>

      <div className="my-8 grid grid-cols-3 gap-3">
        {[
          ["44", "Prompts"],
          ["~7", "Minutes"],
          ["8", "Clusters"],
        ].map(([number, label]) => (
          <div
            key={label}
            className="rounded-2xl border border-glass-border bg-glass px-3 py-4"
          >
            <div className="font-display text-2xl font-semibold leading-none text-accent-orange">
              {number}
            </div>
            <div className="mt-1 text-[0.67rem] font-semibold uppercase tracking-[0.1em] text-text-60">
              {label}
            </div>
          </div>
        ))}
      </div>

      {completed ? (
        <div className="mb-4 rounded-2xl border border-glass-border bg-glass-strong p-4 text-sm leading-6 text-text-80">
          Your Compass is ready. The full result screen lands in the next phase;
          this build already saves the completed score locally.
        </div>
      ) : null}

      <div className="rounded-2xl border border-glass-border bg-glass p-4">
        <div className="flex gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-grad-warm font-display text-xl font-bold shadow-[0_8px_24px_rgba(255,61,131,0.35)]">
            K
          </div>
          <p className="text-sm leading-6 text-text-80">
            <strong className="font-semibold text-text-100">
              Hey, I&apos;m Kai.
            </strong>{" "}
            No wrong answers. Pick what you would actually do, not what sounds
            impressive.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {canResume ? (
          <button
            type="button"
            onClick={resume}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-grad-warm px-5 text-sm font-bold uppercase tracking-[0.04em] text-white shadow-[0_14px_40px_rgba(255,61,131,0.42)] transition active:scale-[0.99]"
          >
            {resumeLabel}
            <ArrowRight aria-hidden="true" size={18} strokeWidth={2.4} />
          </button>
        ) : null}

        <button
          type="button"
          onClick={startFresh}
          className={
            canResume
              ? "inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-glass-border bg-glass px-5 text-sm font-semibold text-text-100 transition active:scale-[0.99]"
              : "inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-grad-warm px-5 text-sm font-bold uppercase tracking-[0.04em] text-white shadow-[0_14px_40px_rgba(255,61,131,0.42)] transition active:scale-[0.99]"
          }
        >
          {canResume ? "Start Over" : "Start the Assessment"}
          {canResume ? (
            <RotateCcw aria-hidden="true" size={17} strokeWidth={2.3} />
          ) : (
            <ArrowRight aria-hidden="true" size={18} strokeWidth={2.4} />
          )}
        </button>
      </div>
    </section>
  );
}
