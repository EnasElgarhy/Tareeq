"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { KaiAuraV2 } from "@/components/brand/KaiAuraV2";
import { KaiChromaVideo } from "@/components/brand/KaiChromaVideo";
import { useAssessmentAudio } from "@/components/assessment/AssessmentAudioProvider";
import {
  INTRO_NARRATION_AUDIO_ID,
  INTRO_NARRATION_OWNER_ID,
} from "@/components/assessment/intro-audio";
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
import { readCoreReport } from "@/lib/core-v2/storage";
import { readCurrentReportGeneratedAt } from "@/lib/results/current-report";
import {
  readPlatformConsent,
  readResultRegistration,
  writePlatformConsent,
} from "@/lib/results/storage";

interface AssessmentStartProps {
  totalQuestions: number;
  versionId: string | null;
  versionLabel: string;
}

type AssessmentSessionResponse = {
  versionId: string | null;
  versionLabel: string;
  totalQuestions: number;
};

async function setAssessmentSession(
  versionId: string | null,
  versionLabel: string,
): Promise<AssessmentSessionResponse> {
  const response = await fetch("/api/assessment-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ versionId, versionLabel }),
  });
  if (!response.ok) throw new Error("Assessment version unavailable.");
  return (await response.json()) as AssessmentSessionResponse;
}

const STEPS: ReadonlyArray<{
  n: number;
  titleKey: StringKey;
  metaKey: StringKey;
}> = [
  { n: 1, titleKey: "start.step1.title", metaKey: "start.step1.meta" },
  { n: 2, titleKey: "start.step2.title", metaKey: "start.step2.meta" },
  { n: 3, titleKey: "start.step3.title", metaKey: "start.step3.meta" },
];

export function AssessmentStart({
  totalQuestions,
  versionId,
  versionLabel,
}: AssessmentStartProps) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const { playNarration, preloadNarration, setMuted } = useAssessmentAudio();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<LocalAssessmentProgress | null>(
    null,
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  // Consent already on record (from an earlier start) — no need to ask again.
  const [hasStoredConsent, setHasStoredConsent] = useState(false);
  const [startError, setStartError] = useState("");
  const [settingVersion, setSettingVersion] = useState(false);

  useEffect(() => {
    setProgress(readLocalAssessment());
    const stored = Boolean(readPlatformConsent());
    setHasStoredConsent(stored);
    setTermsAccepted(stored);
  }, []);

  useEffect(() => {
    preloadNarration({ audioId: INTRO_NARRATION_AUDIO_ID, locale });
  }, [locale, preloadNarration]);

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

  async function startFresh() {
    if (!termsAccepted && !readPlatformConsent()) {
      setStartError(t("start.terms_error"));
      return;
    }

    const isRetake = Boolean(progress?.completedAt);
    setStartError("");
    setSettingVersion(true);
    defaultVoiceOnForAssessmentStart();
    setMuted(false);
    playNarration({
      audioId: INTRO_NARRATION_AUDIO_ID,
      locale,
      ownerId: INTRO_NARRATION_OWNER_ID,
    });
    uiSounds.advance();
    if (!readPlatformConsent()) writePlatformConsent();
    try {
      const session = await setAssessmentSession(versionId, versionLabel);
      resetLocalAssessment();
      const fresh = createLocalAssessment({
        versionId: session.versionId,
        versionLabel: session.versionLabel,
      });
      writeLocalAssessment(fresh);
      trackEvent("assessment_started", {
        assessmentId: fresh.assessmentId,
        assessmentVersion: fresh.versionLabel,
      });
      if (isRetake) {
        trackEvent("assessment_retaken", { assessmentId: fresh.assessmentId });
      }
      window.location.assign("/intro");
    } catch {
      setSettingVersion(false);
      setStartError(
        locale === "ar"
          ? "تعذّر بدء التقييم الآن. يُرجى المحاولة مرة أخرى."
          : "We couldn't start the assessment. Please try again.",
      );
    }
  }

  async function resume() {
    if (!progress) return;
    defaultVoiceOnForAssessmentStart();
    uiSounds.advance();
    setStartError("");
    setSettingVersion(true);
    try {
      const session = await setAssessmentSession(
        progress.versionId,
        progress.versionLabel,
      );
      const resumed = writeLocalAssessment({
        ...progress,
        versionId: session.versionId,
        versionLabel: session.versionLabel,
      });
      trackEvent("assessment_resumed", {
        assessmentId: resumed.assessmentId,
        assessmentVersion: resumed.versionLabel,
      });
      window.location.assign(
        getQuestionPath(
          getResumeQuestionIndex(resumed, session.totalQuestions),
        ),
      );
    } catch {
      setSettingVersion(false);
      setStartError(
        locale === "ar"
          ? "تعذّر استئناف هذه النسخة من التقييم."
          : "We couldn't resume this assessment version.",
      );
    }
  }

  function continueCompleted() {
    uiSounds.advance();
    // A finished CORE 2.0 attempt whose report isn't built yet goes on to
    // registration / analysis even when an older legacy report exists.
    const progress = readLocalAssessment();
    const coreReportPending =
      Boolean(progress?.coreResult) &&
      readCoreReport()?.generatedAt !== progress?.completedAt;
    if (!coreReportPending && readCurrentReportGeneratedAt()) {
      router.push("/compass");
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
      <div className="relative hidden h-[340px] w-full items-center justify-center lg:flex">
        <div
          aria-hidden="true"
          className="anim-aura-bloom pointer-events-none absolute"
        >
          <KaiAuraV2 size={360} />
        </div>
        <div aria-hidden="true" className="anim-kai-drop relative z-10">
          <div className="anim-kai-drop-bob">
            <KaiChromaVideo
              src="/kai/kai-intro-green-v2.mp4"
              size={260}
              playing={false}
              restTime={0}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <h1
            id="start-heading"
            className="text-hero text-sand max-w-[16ch] lg:max-w-[22ch]"
          >
            {t("start.headline_line1")}
            <br />
            {t("start.headline_line2_before")}{" "}
            <span className="text-grad-warm">
              {t("start.headline_emphasis")}
            </span>
            {t("start.headline_after")}
          </h1>
        </div>

        {/* Hero illustration — phone/tablet only; desktop uses its own
         *  column above. */}
        <div className="relative mx-auto flex h-[240px] w-[240px] items-center justify-center lg:hidden">
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
                src="/kai/kai-intro-green-v2.mp4"
                size={240}
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
              disabled={settingVersion}
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

        {/* Step ladder — lifted into its own card so "the path" reads as
         *  one deliberate module rather than a plain list floating on
         *  the night surface. */}
        <div className="glass-card !p-3.5 !rounded-[22px]">
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
        </div>

        <div className="flex-1 lg:hidden" />

        <div className="grid gap-3">
          {/* Begin always requires consent, so the box shows whenever
           *  none is on record — including a retake after a finished run
           *  that predates the stored consent. */}
          {!canResume && !hasStoredConsent ? (
            <ConsentCheckbox
              checked={termsAccepted}
              invalid={Boolean(startError) && !termsAccepted}
              onChange={(checked) => {
                setTermsAccepted(checked);
                setStartError("");
              }}
            />
          ) : null}

          {startError ? (
            <p role="alert" className="text-[12px] font-semibold text-error">
              {startError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={canResume ? resume : startFresh}
            disabled={settingVersion}
            className="btn-v2 btn-v2--primary w-full lg:w-fit lg:px-8"
            data-size="lg"
          >
            {canResume
              ? t("start.resume_at_cta").replace("{n}", String(resumeAt))
              : t("start.begin_cta")}
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
              disabled={settingVersion}
              className="btn-v2 btn-v2--ghost-on-dark w-full lg:w-fit"
              data-size="md"
            >
              {t("start.start_over_cta")}
            </button>
          ) : (
            <p className="text-center text-[12.5px] text-sand/45 lg:text-start">
              {t("start.footer_note")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

interface ConsentCheckboxProps {
  checked: boolean;
  invalid: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Platform-terms consent — sits directly above Begin, since agreeing comes
 * before starting. A custom 20px box (gold when checked, like the CTA) with
 * the agreement on one line and the research-consent note beneath it.
 */
function ConsentCheckbox({ checked, invalid, onChange }: ConsentCheckboxProps) {
  const { t } = useLocale();
  const [before, afterTerms = ""] = t("start.terms_agree").split("{terms}");
  const [between, after = ""] = afterTerms.split("{privacy}");
  const linkClass =
    "font-medium text-sand underline decoration-sand/30 underline-offset-[3px] transition-colors hover:decoration-gold";

  return (
    <label className="consent-check group flex cursor-pointer items-start gap-3 text-start">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-invalid={invalid || undefined}
        aria-describedby="consent-research-note"
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        data-invalid={invalid || undefined}
        className="consent-check__box mt-px grid size-5 shrink-0 place-items-center rounded-[6px]"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] leading-snug text-sand/80">
          {before}
          <Link href="/terms-of-service" target="_blank" className={linkClass}>
            {t("start.terms_link")}
          </Link>
          {between}
          <Link href="/privacy-policy" target="_blank" className={linkClass}>
            {t("start.privacy_link")}
          </Link>
          {after}
        </span>
        <span
          id="consent-research-note"
          className="mt-1 block text-[12px] leading-snug text-sand/45"
        >
          {t("start.terms_research_note")}
        </span>
      </span>
    </label>
  );
}
