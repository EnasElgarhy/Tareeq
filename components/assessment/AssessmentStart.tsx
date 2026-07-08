"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { KaiChromaVideo } from "@/components/brand/KaiChromaVideo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  defaultVoiceOnForAssessmentStart,
  uiSounds,
} from "@/lib/audio/ui-sounds";
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
import { trackEvent } from "@/lib/analytics/track";
import type { StringKey } from "@/lib/i18n/strings";
import {
  readGeneratedReport,
  readPlatformConsent,
  readResultRegistration,
  writePlatformConsent,
} from "@/lib/results/storage";

interface AssessmentStartProps {
  totalQuestions: number;
}

const STEPS: ReadonlyArray<{ n: number; titleKey: StringKey; metaKey: StringKey }> = [
  { n: 1, titleKey: "start.step1.title", metaKey: "start.step1.meta" },
  { n: 2, titleKey: "start.step2.title", metaKey: "start.step2.meta" },
  { n: 3, titleKey: "start.step3.title", metaKey: "start.step3.meta" },
];

export function AssessmentStart({ totalQuestions }: AssessmentStartProps) {
  const router = useRouter();
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<LocalAssessmentProgress | null>(
    null,
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [startError, setStartError] = useState("");

  useEffect(() => {
    setProgress(readLocalAssessment());
    setTermsAccepted(Boolean(readPlatformConsent()));
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
    if (!termsAccepted && !readPlatformConsent()) {
      setStartError(t("start.terms_error"));
      return;
    }

    const isRetake = Boolean(progress?.completedAt);
    defaultVoiceOnForAssessmentStart();
    uiSounds.advance();
    if (!readPlatformConsent()) writePlatformConsent();
    resetLocalAssessment();
    const fresh = createLocalAssessment();
    writeLocalAssessment(fresh);
    trackEvent("assessment_started", { assessmentId: fresh.assessmentId });
    if (isRetake) trackEvent("assessment_retaken", { assessmentId: fresh.assessmentId });
    router.push("/intro");
  }

  function resume() {
    defaultVoiceOnForAssessmentStart();
    uiSounds.advance();
    setStartError("");
    if (progress) trackEvent("assessment_resumed", { assessmentId: progress.assessmentId });
    router.push(
      getQuestionPath(getResumeQuestionIndex(progress, totalQuestions)),
    );
  }

  function continueCompleted() {
    uiSounds.advance();
    if (readGeneratedReport()) {
      router.push("/results");
      return;
    }
    if (readResultRegistration()) {
      router.push("/analyzing");
      return;
    }
    router.push("/register");
  }

  return (
    <section
      aria-labelledby="start-heading"
      className="anim-screen-enter flex flex-1 flex-col gap-3 lg:grid lg:grid-cols-2 lg:content-center lg:items-center lg:gap-10"
    >
      {/* Desktop-only illustration — Kai's own left column. A separate
       *  instance from the mobile one below rather than reordered with
       *  CSS, so the mobile visual sequence (headline → Kai → steps)
       *  never has to be disturbed to achieve the desktop split. Static
       *  (playing=false, no audioRef), so a second instance is cheap. */}
      <div className="relative hidden h-[280px] w-full items-center justify-center lg:flex">
        <div aria-hidden="true" className="anim-kai-drop relative z-10">
          <div className="anim-kai-drop-bob">
            <KaiChromaVideo
              src="/kai/kai-intro-green.mp4"
              size={180}
              playing={false}
              restTime={0}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <span className="anim-eyebrow-fade-up chip chip--violet-on-dark w-fit">
          <span className="size-1.5 rounded-full bg-gold" />
          {t("start.eyebrow")}
        </span>

        <h1 id="start-heading" className="text-hero text-sand max-w-[16ch] lg:max-w-[22ch]">
          {t("start.headline_line1")}
          <br />
          {t("start.headline_line2_before")}{" "}
          <span
            className="text-grad-warm"
            style={{
              fontStyle: "italic",
              fontVariationSettings: '"SOFT" 100, "opsz" 144',
            }}
          >
            {t("start.headline_emphasis")}
          </span>
          {t("start.headline_after")}
        </h1>

        {/* Hero illustration — phone/tablet only; desktop uses its own
         *  column above. */}
        <div className="relative mx-auto flex h-[180px] w-[180px] items-center justify-center lg:hidden">
          <div
            aria-label={t("kai.guide_aria")}
            role="img"
            className="anim-kai-drop relative z-10"
          >
            <div className="anim-kai-drop-bob">
              {/* No narration on this screen, so Kai rests on a closed-mouth
                  frame (she won't "murmur" silently); the CSS float keeps her
                  subtly alive. */}
              <KaiChromaVideo
                src="/kai/kai-intro-green.mp4"
                size={180}
                playing={false}
                restTime={0}
              />
            </div>
          </div>
        </div>

        {/* Resume / complete banner — only on returning visit */}
        {canResume && resumeAt ? (
          <div
            role="status"
            aria-live="polite"
            className="anim-bubble-in glass-card flex items-center justify-between gap-3 !p-3 !rounded-2xl"
          >
            <p className="text-body-sm leading-5 text-sand">
              {t("start.resume_banner")
                .replace("{n}", String(resumeAt))
                .replace("{total}", String(totalQuestions))}
            </p>
            <button
              type="button"
              className="btn-v2 btn-v2--ghost-on-dark"
              data-size="sm"
              onClick={resume}
            >
              {t("start.resume_cta")}
            </button>
          </div>
        ) : null}

        {completed && !canResume ? (
          <div
            role="status"
            aria-live="polite"
            className="anim-bubble-in glass-card flex items-center justify-between gap-3 !p-3 !rounded-2xl"
          >
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-gold" />
              <p className="text-body-sm leading-5 text-sand">
                {t("start.saved_banner")}
              </p>
            </div>
            <button
              type="button"
              className="btn-v2 btn-v2--ghost-on-dark"
              data-size="sm"
              onClick={continueCompleted}
            >
              {t("nav.continue")}
            </button>
          </div>
        ) : null}

        {/* Step ladder — denser */}
        <ol className="relative grid gap-2.5 ps-0.5">
          <span
            aria-hidden="true"
            className="absolute start-[13px] top-4 bottom-4 w-px bg-gradient-to-b from-violet-soft/40 via-violet-soft/20 to-gold/40"
          />
          {STEPS.map((step, i) => (
            <li
              key={step.n}
              className="anim-option-in relative grid grid-cols-[28px_1fr] items-center gap-3"
              style={{ animationDelay: `${320 + i * 90}ms` }}
            >
              <span className="glass-tile relative z-10 grid size-7 place-items-center rounded-full text-sand text-[12px] font-bold">
                {step.n}
              </span>
              <div>
                <p className="text-body-sm font-semibold text-sand leading-tight">
                  {t(step.titleKey)}
                </p>
                <p className="text-[12px] text-sand/55 leading-tight">
                  {t(step.metaKey)}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex-1 lg:hidden" />

        <div className="grid gap-2">
          <button
            type="button"
            onClick={canResume ? resume : startFresh}
            className="btn-v2 btn-v2--primary w-full lg:w-fit lg:px-8"
            data-size="lg"
          >
            {canResume ? t("start.resume_at_cta").replace("{n}", String(resumeAt)) : t("start.begin_cta")}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
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
              className="btn-v2 btn-v2--ghost-on-dark w-full lg:w-fit"
              data-size="md"
            >
              {t("start.start_over_cta")}
            </button>
          ) : (
            <>
              {!completed ? (
                <label className="flex items-start gap-2 rounded-2xl border border-sand/10 bg-sand/[0.045] px-3 py-2 text-start">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => {
                      setTermsAccepted(event.target.checked);
                      setStartError("");
                    }}
                    className="mt-0.5 size-4 accent-gold"
                  />
                  <span className="text-[11px] leading-snug text-sand/58">
                    {t("start.terms_checkbox")}
                  </span>
                </label>
              ) : null}
              {startError ? (
                <p
                  role="alert"
                  className="text-center text-[11px] font-semibold text-error lg:text-start"
                >
                  {startError}
                </p>
              ) : null}
              <p className="text-center text-eyebrow text-sand/45 pt-0.5 lg:text-start">
                {t("start.footer_note")}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
