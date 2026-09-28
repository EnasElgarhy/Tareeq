"use client";

import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { TareeqArrowLeft } from "@/components/brand/icons";
import { type KaiMood } from "@/components/brand/Kai";
import { KaiChromaVideo } from "@/components/brand/KaiChromaVideo";
import { DidYouKnow } from "@/components/onboarding/DidYouKnow";
import { useAssessmentAudio } from "@/components/assessment/AssessmentAudioProvider";
import { prefersReducedMotion, uiSounds } from "@/lib/audio/ui-sounds";
import {
  completeLocalAssessment,
  ensureLocalAssessment,
  readLocalAssessment,
  saveLocalAnswer,
} from "@/lib/assessment/progress";
import { bumpQuestionAttempt } from "@/lib/assessment/question-attempts";
import {
  INTERSTITIALS,
  findInterstitialFor,
  markInterstitialSeen,
  type Interstitial,
} from "@/lib/assessment/interstitials";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getLocalizedText, getQuestionPath } from "@/lib/assessment/questions";
import { computeScore, type Question } from "@/lib/scoring";
import { trackEvent } from "@/lib/analytics/track";

type AudioState =
  | "idle"
  | "loading"
  | "playing"
  | "muted"
  | "locked"
  | "unavailable";
type ExitDirection = "forward" | "back" | null;

interface QuestionScreenProps {
  question: Question;
  questions: Question[];
  index: number;
  totalQuestions: number;
  versionId: string | null;
  versionLabel: string;
  menaCountries: string[];
  restOfWorldCountries: string[];
}

/** Per-letter accent — used for the answer-card inset stripe + Kai mood. */
const OPTION_PALETTE = [
  { accent: "#F4C660", mood: "warm" as KaiMood }, // gold
  { accent: "#9D7FF0", mood: "curious" as KaiMood }, // violet-soft
  { accent: "#F2A8B3", mood: "thinking" as KaiMood }, // blush
  { accent: "#6FE0C0", mood: "encouraging" as KaiMood }, // mint
  { accent: "#C8B6F0", mood: "listening" as KaiMood }, // lilac
];

type KaiSceneKind =
  | "compass"
  | "spark"
  | "route"
  | "lens"
  | "cards"
  | "signal"
  | "orbit"
  | "growth";

type KaiScene = {
  kind: KaiSceneKind;
  accent: string;
  secondary: string;
};

const KAI_QUESTION_SCENES: KaiScene[] = [
  { kind: "compass", accent: "#F4C660", secondary: "#6FE0C0" },
  { kind: "spark", accent: "#FF7A4A", secondary: "#F2A8B3" },
  { kind: "route", accent: "#6FE0C0", secondary: "#9D7FF0" },
  { kind: "lens", accent: "#F2A8B3", secondary: "#F4C660" },
  { kind: "cards", accent: "#9D7FF0", secondary: "#FF7A4A" },
  { kind: "signal", accent: "#C8B6F0", secondary: "#6FE0C0" },
  { kind: "orbit", accent: "#F4C660", secondary: "#9D7FF0" },
  { kind: "growth", accent: "#6FE0C0", secondary: "#F2A8B3" },
];
const DEFAULT_KAI_QUESTION_SCENE = KAI_QUESTION_SCENES[0] as KaiScene;

export function QuestionScreen({
  question,
  questions,
  index,
  totalQuestions,
  versionId,
  versionLabel,
  menaCountries,
  restOfWorldCountries,
}: QuestionScreenProps) {
  const router = useRouter();

  // ---------- Analytics (Phase 3 — question intelligence) ----------
  /** When this question was mounted — the baseline for time_spent_ms. */
  const questionViewStartRef = useRef<number>(Date.now());
  /** The answer this question had *before* the current interaction — the
   * baseline `recordAnswer` diffs against to tell "answered" from
   * "changed" from "re-saved the same value" (e.g. clicking Next right
   * after a dropdown selection already saved it). */
  const initialAnswerRef = useRef<string>("");
  /** Guards against double-firing question_time_spent/question_abandoned
   * for the same question instance (e.g. a real departure racing the
   * pagehide listener). */
  const hasLeftQuestionRef = useRef(false);

  const [selected, setSelected] = useState("");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [exiting, setExiting] = useState<ExitDirection>(null);
  const [pendingInterstitial, setPendingInterstitial] =
    useState<Interstitial | null>(null);
  const [kaiVideoReady, setKaiVideoReady] = useState(false);

  const [speed, setSpeed] = useState(1);

  const { locale, t } = useLocale();
  const assessmentVersion = useMemo(
    () => ({ versionId, versionLabel }),
    [versionId, versionLabel],
  );
  const {
    audioRef,
    playNarration,
    preloadNarration,
    stopNarration,
    replayNarration,
    setMuted,
    setPlaybackRate,
    isPlaying,
    isPreparing,
    isMuted,
    activeOwnerId: playbackOwnerId,
    error: audioError,
  } = useAssessmentAudio();

  const isLastQuestion = index === totalQuestions - 1;
  const isSelect = question.kind === "select";
  const isText = question.kind === "text";
  const isExplicit = isSelect || isText;
  const optionCount = question.options.length;
  const isDenseChoice = !isExplicit && optionCount >= 4;
  const optionRangeLabel =
    optionCount > 0
      ? `A-${question.options[optionCount - 1]?.letter ?? optionCount}`
      : "";
  const title = getLocalizedText(question.title, locale);
  const activeNarrationId = pendingInterstitial?.audioId ?? question.externalId;
  const activeOwnerId = pendingInterstitial
    ? `interstitial:${pendingInterstitial.key}`
    : `question:${question.externalId}`;
  const isActiveAudioOwner = playbackOwnerId === activeOwnerId;
  const soundOn = !isMuted;
  const audioState: AudioState = isMuted
    ? "muted"
    : audioError && isActiveAudioOwner
      ? "unavailable"
      : isPreparing && isActiveAudioOwner
        ? "loading"
        : isPlaying && isActiveAudioOwner
          ? "playing"
          : "idle";

  /**
   * Shared per-event context for every question_* analytics call.
   * `questionId` is `externalId` (e.g. "Q5"), not a DB uuid — the consumer
   * app renders from a static seed with no uuid available at all; see the
   * `question_id` doc comment on AnalyticsEvent in lib/analytics/types.ts.
   */
  const questionContext = useCallback(
    (extra: Record<string, unknown> = {}) => ({
      assessmentId: readLocalAssessment()?.assessmentId ?? null,
      assessmentVersion: versionLabel,
      questionId: question.externalId,
      questionPosition: question.position,
      pillar: question.pillar,
      ...extra,
    }),
    [question.externalId, question.pillar, question.position, versionLabel],
  );

  /** Fires question_answered / question_answer_changed, but only when the
   * value genuinely differs from what this question already had —
   * multiple UI paths (auto-advance, dropdown select, explicit Next) can
   * all end up "saving" the same already-current value. */
  const recordAnswer = useCallback(
    (value: string) => {
      const previous = initialAnswerRef.current;
      if (previous === value) return;
      trackEvent(previous ? "question_answer_changed" : "question_answered", {
        ...questionContext({
          selectedAnswer: value,
          previousAnswer: previous || null,
        }),
      });
      initialAnswerRef.current = value;
    },
    [questionContext],
  );

  /** Fires once, at the moment this question is actually left (forward or
   * back) — question_time_spent always; question_completed only when
   * leaving forward with a real answer recorded. */
  const leaveQuestion = useCallback(
    (direction: "forward" | "back") => {
      if (hasLeftQuestionRef.current) return;
      hasLeftQuestionRef.current = true;
      const timeSpentMs = Date.now() - questionViewStartRef.current;
      trackEvent(
        "question_time_spent",
        questionContext({ timeSpentMs, direction }),
      );
      if (direction === "forward" && initialAnswerRef.current) {
        trackEvent("question_completed", questionContext({ timeSpentMs }));
      }
    },
    [questionContext],
  );

  const kaiScene = useMemo(
    () =>
      KAI_QUESTION_SCENES[index % KAI_QUESTION_SCENES.length] ??
      DEFAULT_KAI_QUESTION_SCENE,
    [index],
  );

  useEffect(() => {
    ensureLocalAssessment(assessmentVersion);
    const progress = readLocalAssessment();
    const previousAnswer = progress?.answers[question.externalId] ?? "";
    const isRevisit = previousAnswer !== "";

    setSelected(previousAnswer);
    setConfirming(null);
    setExiting(null);
    setHoveredIdx(null);
    setPendingInterstitial(null);
    if (progress && Object.keys(progress.answers).length > 0) {
      uiSounds.transition();
    }

    initialAnswerRef.current = previousAnswer;
    questionViewStartRef.current = Date.now();
    hasLeftQuestionRef.current = false;
    const attemptNumber = bumpQuestionAttempt(question.externalId);
    trackEvent(
      isRevisit ? "question_revisited" : "question_viewed",
      questionContext({ isFirstVisit: !isRevisit, attemptNumber }),
    );
    // question_skipped is intentionally not fired here — this consumer app
    // has no UI concept of skipping a required question (every kind must
    // be answered to advance; see QUESTION_ANALYTICS_ARCHITECTURE.md).
  }, [assessmentVersion, question.externalId, questionContext]);

  // Best-effort question_abandoned: fires only on a true page
  // unload/close/navigate-away (pagehide), not on ordinary tab-switching
  // (visibilitychange was considered and rejected — it fires on every tab
  // blur, which would massively over-count abandonment). This means
  // abandonment on browsers with unreliable pagehide (some older mobile
  // Safari versions) will under-count rather than over-count, which is the
  // safer failure direction for a metric admins will act on.
  useEffect(() => {
    function handlePageHide() {
      if (hasLeftQuestionRef.current) return;
      hasLeftQuestionRef.current = true;
      trackEvent(
        "question_abandoned",
        questionContext({
          timeSpentMs: Date.now() - questionViewStartRef.current,
        }),
      );
    }
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [question.externalId, questionContext]);

  const countryOptions = useMemo(
    () => [
      {
        groupLabel: t("question.select_country_group_mena"),
        options: menaCountries.map((c) => ({ value: c, label: c })),
      },
      {
        groupLabel: t("question.select_country_group_other"),
        options: restOfWorldCountries.map((c) => ({ value: c, label: c })),
      },
    ],
    [menaCountries, restOfWorldCountries, t],
  );

  // ---------- Navigation ----------

  const commitAndAdvance = useCallback(
    (letter: string) => {
      if (confirming || exiting || pendingInterstitial) return;
      setSelected(letter);
      setConfirming(letter);
      uiSounds.confirm();

      recordAnswer(letter);
      trackEvent(
        "question_auto_advanced",
        questionContext({ selectedAnswer: letter }),
      );

      const progress = saveLocalAnswer(
        question.externalId,
        letter,
        index,
        assessmentVersion,
      );
      const reduced = prefersReducedMotion();
      const confirmDelay = reduced ? 70 : 180;
      const exitDelay = reduced ? 50 : 120;

      // Always show at milestones (ignore the per-key "seen" flag) so the
      // "Did you know?" beats are reliably testable on any run/server.
      // findInterstitialFor still prefers unseen variants for variety.
      const shouldShow = !isLastQuestion ? findInterstitialFor(index) : null;

      window.setTimeout(() => {
        if (shouldShow) {
          stopNarration(activeOwnerId);
          markInterstitialSeen(shouldShow.key);
          setConfirming(null);
          setPendingInterstitial(shouldShow);
          return;
        }
        if (isLastQuestion) uiSounds.complete();
        else uiSounds.advance();
        setExiting("forward");
        window.setTimeout(() => {
          leaveQuestion("forward");
          if (!isLastQuestion) {
            router.push(getQuestionPath(index + 1));
            return;
          }
          const result = computeScore(progress.answers, questions);
          completeLocalAssessment(result, index, assessmentVersion);
          router.push("/register");
        }, exitDelay);
      }, confirmDelay);
    },
    [
      confirming,
      exiting,
      index,
      isLastQuestion,
      leaveQuestion,
      pendingInterstitial,
      question.externalId,
      questionContext,
      questions,
      recordAnswer,
      router,
      activeOwnerId,
      assessmentVersion,
      stopNarration,
    ],
  );

  function dismissInterstitial() {
    stopNarration(activeOwnerId);
    setPendingInterstitial(null);
    setExiting("forward");
    window.setTimeout(
      () => {
        leaveQuestion("forward");
        router.push(getQuestionPath(index + 1));
      },
      prefersReducedMotion() ? 60 : 220,
    );
  }

  function goPrevious() {
    if (exiting) return;
    stopNarration(activeOwnerId);
    uiSounds.back();
    setExiting("back");
    window.setTimeout(
      () => {
        leaveQuestion("back");
        router.push(index > 0 ? getQuestionPath(index - 1) : "/contract");
      },
      prefersReducedMotion() ? 60 : 220,
    );
  }

  function goNextExplicit() {
    if (!selected.trim() || exiting) return;
    stopNarration(activeOwnerId);
    uiSounds.advance();
    recordAnswer(selected);
    const progress = saveLocalAnswer(
      question.externalId,
      selected,
      index,
      assessmentVersion,
    );
    setExiting("forward");
    window.setTimeout(
      () => {
        leaveQuestion("forward");
        if (!isLastQuestion) {
          router.push(getQuestionPath(index + 1));
          return;
        }
        const result = computeScore(progress.answers, questions);
        completeLocalAssessment(result, index, assessmentVersion);
        router.push("/register");
      },
      prefersReducedMotion() ? 60 : 220,
    );
  }

  function chooseFromSelect(value: string) {
    setSelected(value);
    uiSounds.select();
    recordAnswer(value);
    saveLocalAnswer(question.externalId, value, index, assessmentVersion);
  }

  // ---------- Keyboard ----------

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isText) return;
      if (isSelect) {
        if (event.key === "Enter" && selected) {
          event.preventDefault();
          goNextExplicit();
        }
        return;
      }
      const asNumber = Number.parseInt(event.key, 10);
      const option = question.options[asNumber - 1];
      if (!option) return;
      event.preventDefault();
      setHoveredIdx(asNumber - 1);
      commitAndAdvance(option.letter);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isText, isSelect, question.options, selected, commitAndAdvance]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Audio ----------

  useEffect(() => {
    if (exiting || !kaiVideoReady) return;
    playNarration({
      audioId: activeNarrationId,
      locale,
      ownerId: activeOwnerId,
      versionId: pendingInterstitial ? null : versionId,
    });
    return () => stopNarration(activeOwnerId);
  }, [
    activeNarrationId,
    activeOwnerId,
    exiting,
    kaiVideoReady,
    locale,
    pendingInterstitial,
    playNarration,
    stopNarration,
    versionId,
  ]);

  useEffect(() => {
    if (kaiVideoReady) return;
    const timeout = window.setTimeout(() => setKaiVideoReady(true), 3500);
    return () => window.clearTimeout(timeout);
  }, [kaiVideoReady]);

  useEffect(() => {
    setPlaybackRate(speed);
  }, [setPlaybackRate, speed]);

  useEffect(() => {
    const nextQuestion = questions[index + 1];
    if (nextQuestion) {
      router.prefetch(getQuestionPath(index + 1));
      preloadNarration({
        audioId: nextQuestion.externalId,
        locale,
        versionId,
      });
    }

    const interstitialAudioIds = new Set(
      INTERSTITIALS.filter((item) => item.triggerAfterIndex === index).map(
        (item) => item.audioId,
      ),
    );
    interstitialAudioIds.forEach((audioId) => {
      preloadNarration({ audioId, locale });
    });
  }, [index, locale, preloadNarration, questions, router, versionId]);

  useEffect(() => {
    if (index !== 7) return;

    const controller = new AbortController();
    const options = {
      cache: "force-cache" as const,
      signal: controller.signal,
    };
    void Promise.allSettled([
      window.fetch("/kai/kai-did-you-know-v3.mp4", options),
      window.fetch("/kai/kai-did-you-know-rest-v3.webp", options),
    ]);

    return () => controller.abort();
  }, [index]);

  function toggleSound() {
    const nextMuted = soundOn;
    setMuted(nextMuted);
    if (!nextMuted) {
      window.setTimeout(() => replayNarration(activeOwnerId), 0);
    }
  }

  const exitClass =
    exiting === "forward"
      ? "anim-screen-exit-forward"
      : exiting === "back"
        ? "anim-screen-exit-back"
        : "anim-screen-enter";

  // Shared between the mobile audio-controls row and the desktop right
  // column below — same buttons, same state, just rendered in two
  // different places at different breakpoints (never both at once).
  const audioControlsButtons = (
    <>
      <button
        type="button"
        onClick={toggleSound}
        className="assessment-icon-button size-10"
        data-active={soundOn}
        aria-label={soundOn ? t("audio.mute") : t("audio.unmute")}
        title={soundOn ? t("audio.mute") : t("audio.unmute")}
      >
        {soundOn ? (
          <Volume2 size={16} strokeWidth={1.9} aria-hidden="true" />
        ) : (
          <VolumeX size={16} strokeWidth={1.9} aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          if (audioState === "playing") {
            stopNarration(activeOwnerId);
            return;
          }
          replayNarration(activeOwnerId);
        }}
        disabled={!soundOn}
        className="assessment-icon-button size-10 disabled:opacity-40"
        aria-label={
          audioState === "playing" ? t("audio.pause") : t("audio.replay")
        }
        title={audioState === "playing" ? t("audio.pause") : t("audio.replay")}
      >
        {audioState === "playing" ? (
          <Pause
            size={16}
            fill="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        ) : (
          <RotateCcw size={16} strokeWidth={1.9} aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          const cycle = [1, 1.25, 1.5, 0.75];
          const next = cycle[(cycle.indexOf(speed) + 1) % cycle.length];
          if (next != null) setSpeed(next);
        }}
        className="assessment-icon-button h-10 min-w-10 px-2.5 text-[11px] font-bold tabular-nums"
        aria-label={t("audio.speed_control").replace("{speed}", String(speed))}
        title={t("audio.speed_control").replace("{speed}", String(speed))}
      >
        {speed}×
      </button>
    </>
  );

  return (
    <>
      {pendingInterstitial ? (
        <DidYouKnow
          interstitial={pendingInterstitial}
          soundOn={soundOn}
          audioRef={audioRef}
          onReplay={() => replayNarration(activeOwnerId)}
          onToggleSound={toggleSound}
          onDismiss={dismissInterstitial}
        />
      ) : null}

      <section
        key={question.externalId}
        aria-labelledby="question-text"
        aria-busy={Boolean(exiting)}
        className={`flex flex-1 flex-col ${isDenseChoice ? "gap-2" : "gap-3"} ${exitClass}`}
      >
        {/* Desktop (lg:) layout — Kai on top, question stretched wider
         *  now that there's real width to use, answers below. `lg:flex-1`
         *  makes this whole block grow to fill the section's available
         *  height instead of sizing to its own short content; centering
         *  it (rather than top-packing it) is what keeps the page from
         *  reading as "everything crammed in the top quarter" — the
         *  footer then just follows naturally near the bottom since this
         *  block has already claimed most of the height. Below lg: this
         *  is the original single column, unchanged. */}
        <div className="flex flex-1 flex-col gap-4 lg:mx-auto lg:w-full lg:max-w-[860px] lg:justify-center lg:gap-6">
          {/* Kai + question bubble — centered, bubble free to use more
           *  width at lg: instead of staying capped at its phone size. */}
          <div className="flex flex-col items-center gap-2.5">
            <div
              className={`relative flex items-center justify-center ${
                isDenseChoice ? "h-[152px] w-[152px]" : "h-[176px] w-[176px]"
              }`}
            >
              <QuestionKaiScene scene={kaiScene} />
              <div
                aria-label={t("kai.guide_aria")}
                role="img"
                className="anim-kai-drop relative z-10"
              >
                <div className="anim-kai-drop-bob">
                  {/* Green screen keyed out on the GPU so Kai drops onto
                      the page transparently — no frame, halo, or card. */}
                  {/* Jumps straight to Kai's talking window the moment
                      narration starts (the clip opens with a ~1.3s closed-
                      mouth beat), loops within it while she speaks, then
                      freezes on the closed frame when the audio finishes. */}
                  <KaiChromaVideo
                    src="/kai/kai-question-green-v3.mp4"
                    size={isDenseChoice ? 176 : 200}
                    audioRef={audioRef}
                    onReadyChange={setKaiVideoReady}
                    playStart={0.125}
                    playEnd={1.95}
                    restTime={0}
                  />
                </div>
              </div>
            </div>

            {/* Question bubble */}
            <div
              className={`bubble assessment-question-card anim-bubble-in w-full max-w-[440px] !px-5 lg:max-w-[700px] lg:!px-7 ${
                isDenseChoice ? "!py-2.5" : "!py-3"
              }`}
              data-surface="night"
              data-tail-edge="top"
              data-tail-position="center"
            >
              <span className="bubble__tail" aria-hidden="true" />
              <p
                id="question-text"
                className={`m-0 font-question font-semibold leading-[1.35] text-carbon ${
                  isDenseChoice
                    ? "text-[16px] sm:text-[17px] lg:text-[19px]"
                    : "text-[17px] sm:text-[18px] lg:text-[21px]"
                }`}
              >
                {title}
              </p>
            </div>

            {/* Audio controls */}
            <div className="flex items-center justify-center gap-2">
              {audioControlsButtons}
            </div>
          </div>

          {/* Answers — flex-1 lets a short option list still push the
           *  footer to the bottom of a phone screen; off at lg: since the
           *  outer block already centers within the section's height. */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-none lg:gap-3">
            {isSelect ? (
              <select
                value={selected}
                onChange={(e) => chooseFromSelect(e.target.value)}
                className="assessment-input h-14 px-4 text-[15px] font-semibold"
                aria-label={t("question.select_country_aria")}
              >
                <option value="" disabled>
                  {t("question.select_country_placeholder")}
                </option>
                {countryOptions.map((group) => (
                  <optgroup key={group.groupLabel} label={group.groupLabel}>
                    {group.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : isText ? (
              <div className="flex flex-1 flex-col gap-2">
                <textarea
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  placeholder={t("question.reflect_placeholder")}
                  rows={5}
                  maxLength={600}
                  className="assessment-input flex-1 resize-none px-4 py-3 text-[15px] leading-relaxed placeholder:text-sand/50"
                  autoFocus
                />
                <p className="assessment-choice-label flex items-center justify-between px-1">
                  <span>{t("question.text_helper")}</span>
                  <span className="tabular-nums">{selected.length}/600</span>
                </p>
              </div>
            ) : (
              <div className="grid gap-2 lg:grid-cols-2 lg:gap-3">
                <p className="assessment-choice-label flex items-center justify-between px-1 lg:col-span-2">
                  <span>
                    {t("question.choose_n_of").replace(
                      "{n}",
                      String(optionCount),
                    )}
                  </span>
                  <span>
                    {optionCount === 2
                      ? t("question.two_paths")
                      : optionRangeLabel}
                  </span>
                </p>
                {question.options.map((option, optionIdx) => {
                  const palette =
                    OPTION_PALETTE[optionIdx % OPTION_PALETTE.length] ??
                    OPTION_PALETTE[0]!;
                  const active = option.letter === selected;
                  const isConfirming = option.letter === confirming;
                  const isHovered = hoveredIdx === optionIdx;
                  const disabled = Boolean(confirming) && !isConfirming;
                  return (
                    <button
                      type="button"
                      key={option.letter}
                      onClick={() => commitAndAdvance(option.letter)}
                      onMouseEnter={() => setHoveredIdx(optionIdx)}
                      onMouseLeave={() =>
                        setHoveredIdx((v) => (v === optionIdx ? null : v))
                      }
                      onFocus={() => setHoveredIdx(optionIdx)}
                      onBlur={() =>
                        setHoveredIdx((v) => (v === optionIdx ? null : v))
                      }
                      disabled={disabled}
                      aria-pressed={active}
                      data-active={isConfirming || active}
                      style={
                        {
                          animationDelay: `${optionIdx * 70}ms`,
                          "--answer-accent": palette.accent,
                        } as CSSProperties
                      }
                      className={[
                        `assessment-answer anim-option-in group relative flex items-center gap-3 px-3.5 text-start lg:px-4 ${
                          isDenseChoice
                            ? "min-h-[46px] py-2 lg:min-h-[56px] lg:py-2.5"
                            : "min-h-[50px] py-2.5 lg:min-h-[60px] lg:py-3"
                        }`,
                        "disabled:pointer-events-none disabled:opacity-45 active:scale-[0.995]",
                        isConfirming ? "anim-option-confirm" : "",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition",
                          isConfirming || active
                            ? "bg-carbon/15 text-carbon"
                            : "text-sand/85",
                        ].join(" ")}
                        style={
                          !isConfirming && !active
                            ? { backgroundColor: `${palette.accent}1f` }
                            : undefined
                        }
                      >
                        {option.letter}
                      </span>
                      <span className="min-w-0 flex-1 text-[14px] leading-snug lg:text-[14.5px]">
                        {getLocalizedText(option.text, locale)}
                      </span>
                      <span
                        aria-hidden="true"
                        className={[
                          "transition-all",
                          isConfirming || active
                            ? "text-carbon/70 opacity-100 translate-x-0"
                            : isHovered
                              ? "text-sand/70 opacity-100 translate-x-0"
                              : "text-sand/30 opacity-0 -translate-x-1",
                        ].join(" ")}
                      >
                        <svg
                          width="14"
                          height="14"
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
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {isExplicit ? (
          <footer className="mx-auto flex w-full max-w-[860px] items-center gap-2">
            <button
              type="button"
              onClick={goPrevious}
              aria-label={t("question.previous_aria")}
              disabled={Boolean(exiting)}
              className="assessment-icon-button size-11 disabled:opacity-40"
            >
              <TareeqArrowLeft size={16} className="flip-rtl" />
            </button>
            <button
              type="button"
              onClick={goNextExplicit}
              disabled={!selected.trim() || Boolean(exiting)}
              className="btn-v2 btn-v2--primary assessment-primary-action flex-1"
              data-size="lg"
            >
              {isLastQuestion ? t("nav.finish") : t("nav.next")}
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </footer>
        ) : (
          <p className="assessment-choice-label mx-auto flex min-h-10 w-full max-w-[860px] items-center justify-between gap-2 px-1">
            <span className="truncate">
              {confirming
                ? t("question.saving")
                : t("question.tap_to_continue")}
            </span>
            <button
              type="button"
              onClick={goPrevious}
              disabled={Boolean(exiting)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sand/65 transition hover:text-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-40"
            >
              <TareeqArrowLeft
                size={11}
                className="flip-rtl"
                showAccent={false}
              />
              {t("nav.previous")}
            </button>
          </p>
        )}
      </section>
    </>
  );
}

function QuestionKaiScene({ scene }: { scene: KaiScene }) {
  const stroke = scene.accent;
  const secondary = scene.secondary;
  const common = {
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 opacity-85"
      viewBox="0 0 156 156"
      fill="none"
    >
      <path
        d="M31 125 C52 140 101 140 126 122"
        stroke="rgba(245, 238, 230, 0.16)"
        strokeWidth="2"
        {...common}
      />

      {scene.kind === "compass" ? (
        <g>
          <path
            d="M27 58 C36 42 51 32 69 29"
            stroke={stroke}
            strokeWidth="2.4"
            opacity="0.7"
            {...common}
          />
          <path d="M111 38 L124 29 L121 45 Z" fill={secondary} opacity="0.82" />
          <path
            d="M116 35 L113 58"
            stroke={secondary}
            strokeWidth="2"
            opacity="0.6"
            {...common}
          />
        </g>
      ) : null}

      {scene.kind === "spark" ? (
        <g>
          <path
            d="M34 42 L39 55 L52 60 L39 65 L34 78 L29 65 L16 60 L29 55 Z"
            fill={stroke}
            opacity="0.78"
          />
          <path
            d="M115 34 L119 43 L128 47 L119 51 L115 60 L111 51 L102 47 L111 43 Z"
            fill={secondary}
            opacity="0.72"
          />
          <path
            d="M107 104 C116 101 124 95 130 86"
            stroke={stroke}
            strokeWidth="2.3"
            opacity="0.55"
            {...common}
          />
        </g>
      ) : null}

      {scene.kind === "route" ? (
        <g>
          <path
            d="M24 111 C42 89 35 61 60 52 C81 44 90 62 106 51 C115 45 120 36 126 27"
            stroke={stroke}
            strokeWidth="2.6"
            opacity="0.65"
            {...common}
          />
          <path d="M22 112 L30 108 L29 118 Z" fill={secondary} opacity="0.8" />
          <path d="M127 26 L125 38 L117 31 Z" fill={secondary} opacity="0.8" />
        </g>
      ) : null}

      {scene.kind === "lens" ? (
        <g>
          <path
            d="M28 44 C28 34 36 27 46 27 C56 27 64 34 64 44 C64 54 56 62 46 62 C36 62 28 54 28 44 Z"
            stroke={stroke}
            strokeWidth="2.5"
            opacity="0.68"
            {...common}
          />
          <path
            d="M57 57 L69 69"
            stroke={stroke}
            strokeWidth="2.5"
            opacity="0.68"
            {...common}
          />
          <path
            d="M111 91 L129 91 M120 82 L120 100"
            stroke={secondary}
            strokeWidth="2.3"
            opacity="0.58"
            {...common}
          />
        </g>
      ) : null}

      {scene.kind === "cards" ? (
        <g>
          <path
            d="M24 43 H50 C53 43 55 45 55 48 V70 C55 73 53 75 50 75 H24 C21 75 19 73 19 70 V48 C19 45 21 43 24 43 Z"
            stroke={stroke}
            strokeWidth="2.2"
            opacity="0.62"
            {...common}
          />
          <path
            d="M107 35 H130 C133 35 135 37 135 40 V60 C135 63 133 65 130 65 H107 C104 65 102 63 102 60 V40 C102 37 104 35 107 35 Z"
            stroke={secondary}
            strokeWidth="2.2"
            opacity="0.62"
            {...common}
          />
          <path
            d="M27 55 H46 M27 63 H41 M110 47 H128 M110 55 H123"
            stroke="rgba(245,238,230,0.48)"
            strokeWidth="1.5"
            {...common}
          />
        </g>
      ) : null}

      {scene.kind === "signal" ? (
        <g>
          <path
            d="M26 104 C39 83 39 61 26 40"
            stroke={stroke}
            strokeWidth="2.4"
            opacity="0.62"
            {...common}
          />
          <path
            d="M36 96 C45 80 45 65 36 48"
            stroke={stroke}
            strokeWidth="2.1"
            opacity="0.42"
            {...common}
          />
          <path
            d="M120 43 C111 60 111 78 120 96"
            stroke={secondary}
            strokeWidth="2.3"
            opacity="0.58"
            {...common}
          />
        </g>
      ) : null}

      {scene.kind === "orbit" ? (
        <g>
          <path
            d="M28 79 C38 51 61 35 86 38 C109 41 124 61 127 84"
            stroke={stroke}
            strokeWidth="2.2"
            opacity="0.55"
            {...common}
          />
          <path d="M42 42 L51 38 L48 48 Z" fill={secondary} opacity="0.78" />
          <path d="M119 91 L129 87 L125 98 Z" fill={secondary} opacity="0.78" />
        </g>
      ) : null}

      {scene.kind === "growth" ? (
        <g>
          <path
            d="M35 104 C36 84 44 69 58 59"
            stroke={stroke}
            strokeWidth="2.4"
            opacity="0.62"
            {...common}
          />
          <path
            d="M58 59 C48 57 42 50 40 39 C51 40 58 47 58 59 Z"
            fill={secondary}
            opacity="0.7"
          />
          <path
            d="M58 59 C68 55 77 47 82 36 C86 48 77 58 58 59 Z"
            fill={stroke}
            opacity="0.72"
          />
          <path
            d="M113 101 C111 82 103 68 91 58"
            stroke={secondary}
            strokeWidth="2.2"
            opacity="0.5"
            {...common}
          />
        </g>
      ) : null}
    </svg>
  );
}
