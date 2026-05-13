"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TareeqArrowLeft } from "@/components/brand/icons";
import { Kai, type KaiMood } from "@/components/brand/Kai";
import { KaiAuraV2 } from "@/components/brand/KaiAuraV2";
import { DidYouKnow } from "@/components/onboarding/DidYouKnow";
import { prefersReducedMotion, uiSounds } from "@/lib/audio/ui-sounds";
import {
  completeLocalAssessment,
  ensureLocalAssessment,
  readLocalAssessment,
  saveLocalAnswer,
} from "@/lib/assessment/progress";
import {
  findInterstitialFor,
  hasSeenInterstitial,
  markInterstitialSeen,
  type Interstitial,
} from "@/lib/assessment/interstitials";
import {
  getLocalizedText,
  getQuestionPath,
} from "@/lib/assessment/questions";
import { computeScore, type Question } from "@/lib/scoring";

type AudioState = "idle" | "loading" | "playing" | "muted" | "unavailable";
type ExitDirection = "forward" | "back" | null;

interface QuestionScreenProps {
  question: Question;
  questions: Question[];
  index: number;
  totalQuestions: number;
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

export function QuestionScreen({
  question,
  questions,
  index,
  totalQuestions,
  menaCountries,
  restOfWorldCountries,
}: QuestionScreenProps) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [selected, setSelected] = useState("");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [exiting, setExiting] = useState<ExitDirection>(null);
  const [pendingInterstitial, setPendingInterstitial] =
    useState<Interstitial | null>(null);

  const [soundOn, setSoundOn] = useState(true);
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [speed, setSpeed] = useState(1);

  const isLastQuestion = index === totalQuestions - 1;
  const isSelect = question.kind === "select";
  const isText = question.kind === "text";
  const isExplicit = isSelect || isText;
  const title = getLocalizedText(question.title);

  const restingMood: KaiMood = useMemo(() => {
    const cycle: KaiMood[] = ["curious", "warm", "thinking", "encouraging"];
    return cycle[index % cycle.length] ?? "curious";
  }, [index]);

  const liveMood: KaiMood = useMemo(() => {
    if (confirming) {
      const idx = question.options.findIndex((o) => o.letter === confirming);
      return OPTION_PALETTE[idx % OPTION_PALETTE.length]?.mood ?? "encouraging";
    }
    if (hoveredIdx != null) {
      return (
        OPTION_PALETTE[hoveredIdx % OPTION_PALETTE.length]?.mood ?? restingMood
      );
    }
    return restingMood;
  }, [confirming, hoveredIdx, question.options, restingMood]);

  useEffect(() => {
    ensureLocalAssessment();
    const progress = readLocalAssessment();
    setSelected(progress?.answers[question.externalId] ?? "");
    setConfirming(null);
    setExiting(null);
    setHoveredIdx(null);
    setPendingInterstitial(null);
    if (progress && Object.keys(progress.answers).length > 0) {
      uiSounds.transition();
    }
  }, [question.externalId]);

  useEffect(() => {
    setSoundOn(window.localStorage.getItem("tareeq:sound") !== "off");
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setAudioState(soundOn ? "idle" : "muted");
  }, [question.externalId, soundOn]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
  }, [speed, audioState]);

  const countryOptions = useMemo(
    () => [
      {
        groupLabel: "Middle East & North Africa",
        options: menaCountries.map((c) => ({ value: c, label: c })),
      },
      {
        groupLabel: "Other",
        options: restOfWorldCountries.map((c) => ({ value: c, label: c })),
      },
    ],
    [menaCountries, restOfWorldCountries],
  );

  // ---------- Navigation ----------

  const commitAndAdvance = useCallback(
    (letter: string) => {
      if (confirming || exiting || pendingInterstitial) return;
      setSelected(letter);
      setConfirming(letter);
      uiSounds.confirm();

      const progress = saveLocalAnswer(question.externalId, letter, index);
      const reduced = prefersReducedMotion();
      const confirmDelay = reduced ? 90 : 380;
      const exitDelay = reduced ? 60 : 240;

      const milestone = !isLastQuestion ? findInterstitialFor(index) : null;
      const shouldShow = milestone && !hasSeenInterstitial(milestone.key);

      window.setTimeout(() => {
        if (shouldShow) {
          markInterstitialSeen(milestone.key);
          setConfirming(null);
          setPendingInterstitial(milestone);
          return;
        }
        if (isLastQuestion) uiSounds.complete();
        else uiSounds.advance();
        setExiting("forward");
        window.setTimeout(() => {
          if (!isLastQuestion) {
            router.push(getQuestionPath(index + 1));
            return;
          }
          const result = computeScore(progress.answers, questions);
          completeLocalAssessment(result, index);
          router.push("/start?complete=1");
        }, exitDelay);
      }, confirmDelay);
    },
    [
      confirming,
      exiting,
      index,
      isLastQuestion,
      pendingInterstitial,
      question.externalId,
      questions,
      router,
    ],
  );

  function dismissInterstitial() {
    setPendingInterstitial(null);
    setExiting("forward");
    window.setTimeout(
      () => router.push(getQuestionPath(index + 1)),
      prefersReducedMotion() ? 60 : 220,
    );
  }

  function goPrevious() {
    if (exiting) return;
    uiSounds.back();
    setExiting("back");
    window.setTimeout(
      () => router.push(index > 0 ? getQuestionPath(index - 1) : "/contract"),
      prefersReducedMotion() ? 60 : 220,
    );
  }

  function goNextExplicit() {
    if (!selected.trim() || exiting) return;
    uiSounds.advance();
    const progress = saveLocalAnswer(question.externalId, selected, index);
    setExiting("forward");
    window.setTimeout(
      () => {
        if (!isLastQuestion) {
          router.push(getQuestionPath(index + 1));
          return;
        }
        const result = computeScore(progress.answers, questions);
        completeLocalAssessment(result, index);
        router.push("/start?complete=1");
      },
      prefersReducedMotion() ? 60 : 220,
    );
  }

  function chooseFromSelect(value: string) {
    setSelected(value);
    uiSounds.select();
    saveLocalAnswer(question.externalId, value, index);
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

  async function playQuestionAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!soundOn) return;
    if (audioState === "playing") {
      audio.pause();
      setAudioState("idle");
      return;
    }
    setAudioState("loading");
    audio.src = `/audio/${question.externalId}.mp3`;
    audio.currentTime = 0;
    audio.playbackRate = speed;
    try {
      await audio.play();
      setAudioState("playing");
    } catch {
      setAudioState("unavailable");
    }
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    window.localStorage.setItem("tareeq:sound", next ? "on" : "off");
    if (!next) {
      audioRef.current?.pause();
      setAudioState("muted");
    } else {
      setAudioState("idle");
    }
  }

  const exitClass =
    exiting === "forward"
      ? "anim-screen-exit-forward"
      : exiting === "back"
        ? "anim-screen-exit-back"
        : "anim-screen-enter";

  return (
    <>
      {pendingInterstitial ? (
        <DidYouKnow
          interstitial={pendingInterstitial}
          onDismiss={dismissInterstitial}
        />
      ) : null}

      <section
        key={question.externalId}
        aria-labelledby="question-text"
        aria-busy={Boolean(exiting)}
        className={`flex flex-1 flex-col gap-3 ${exitClass}`}
      >
        <audio
          ref={audioRef}
          preload="none"
          playsInline
          onEnded={() => setAudioState(soundOn ? "idle" : "muted")}
          onPause={() => {
            if (audioState === "playing")
              setAudioState(soundOn ? "idle" : "muted");
          }}
          onError={() => setAudioState("unavailable")}
        />

        {/* Hero — aurora + Kai + question bubble below */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative flex h-[156px] w-[156px] items-center justify-center">
            <div className="anim-aura-bloom absolute inset-0">
              <KaiAuraV2 size="100%" />
            </div>
            <div
              aria-label="Kai, your guide"
              role="img"
              className="anim-kai-pop relative"
            >
              <div className="anim-avatar-bob">
                <Kai mood={liveMood} size={120} />
              </div>
            </div>
          </div>

          {/* Question bubble */}
          <div
            className="bubble anim-bubble-in w-full max-w-[420px] !py-3 !px-4"
            data-surface="night"
            data-tail-edge="top"
            data-tail-position="center"
          >
            <span className="bubble__tail" aria-hidden="true" />
            <p
              id="question-text"
              className="text-carbon m-0 italic"
              style={{
                fontFamily: "var(--font-question-stack)",
                fontSize: "clamp(16px, 0.95rem + 1.1vw, 22px)",
                lineHeight: 1.28,
                letterSpacing: "-0.005em",
              }}
            >
              {title}
            </p>
          </div>
        </div>

        {/* Audio controls — compact */}
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={toggleSound}
            className="glass-tile inline-flex size-8 items-center justify-center rounded-full text-sand/80 transition hover:text-sand"
            aria-label={soundOn ? "Mute narration" : "Unmute narration"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              {soundOn ? (
                <>
                  <path
                    d="M4 9.5 H7.5 L12 6 V18 L7.5 14.5 H4 Z"
                    fill="currentColor"
                    fillOpacity="0.12"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M15 9.5 a3.8 3.8 0 0 1 0 5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M4 9.5 H7.5 L12 6 V18 L7.5 14.5 H4 Z"
                    fill="currentColor"
                    fillOpacity="0.12"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M15.5 9.5 L20.5 14.5 M20.5 9.5 L15.5 14.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={playQuestionAudio}
            disabled={!soundOn}
            className="inline-flex size-9 items-center justify-center rounded-full bg-gold-gradient text-carbon shadow-gold-glow transition hover:scale-105 active:scale-95 disabled:opacity-40"
            aria-label={
              audioState === "playing" ? "Pause question" : "Play question"
            }
          >
            {audioState === "playing" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="6.5" y="5" width="3.5" height="14" rx="1.4" />
                <rect x="14" y="5" width="3.5" height="14" rx="1.4" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 5.5 L18.5 12 L7 18.5 Z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              const cycle = [1, 1.25, 1.5, 0.75];
              const next = cycle[(cycle.indexOf(speed) + 1) % cycle.length];
              if (next != null) setSpeed(next);
            }}
            className="glass-tile inline-flex h-8 items-center justify-center rounded-full px-2.5 text-[11px] font-semibold text-sand/80 transition hover:text-sand"
            aria-label={`Playback speed ${speed}× — tap to change`}
          >
            {speed}×
          </button>
        </div>

        {/* Answers */}
        <div className="flex flex-1 flex-col gap-1.5 min-h-0">
          {isSelect ? (
            <select
              value={selected}
              onChange={(e) => chooseFromSelect(e.target.value)}
              className="h-14 w-full rounded-pill bg-sand px-5 text-carbon font-semibold text-[15px] shadow-sand-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label="Select your country"
            >
              <option value="" disabled>
                Select your country…
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
                placeholder="Type your reflection…"
                rows={5}
                maxLength={600}
                className="w-full flex-1 resize-none rounded-xl bg-sand/96 px-4 py-3 text-[15px] leading-relaxed text-carbon placeholder:text-carbon/35 shadow-sand-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                autoFocus
              />
              <p className="flex items-center justify-between text-eyebrow text-sand/50">
                <span>No wrong answers — write what comes to mind.</span>
                <span className="tabular-nums">{selected.length}/600</span>
              </p>
            </div>
          ) : (
            <div className="grid gap-1.5">
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
                    style={{
                      animationDelay: `${optionIdx * 70}ms`,
                      boxShadow:
                        isConfirming || active
                          ? `inset 0 0 0 1.5px ${palette.accent}, 0 8px 24px rgba(244,198,96,0.22)`
                          : isHovered
                            ? `inset 0 0 0 1.5px ${palette.accent}80`
                            : `inset 0 0 0 1px rgba(245,238,230,0.10)`,
                    }}
                    className={[
                      "anim-option-in group relative flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2 text-start transition",
                      "disabled:opacity-45 disabled:pointer-events-none active:scale-[0.99]",
                      isConfirming
                        ? "anim-option-confirm bg-grad-warm text-sand shadow-warm-glow"
                        : active
                          ? "bg-grad-warm text-sand shadow-warm-glow"
                          : "glass-card !p-3 !rounded-xl text-sand",
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
                    <span className="flex-1 text-[13.5px] leading-snug">
                      {getLocalizedText(option.text)}
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

        {/* Footer */}
        {isExplicit ? (
          <footer className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrevious}
              aria-label="Previous question"
              disabled={Boolean(exiting)}
              className="glass-tile inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sand transition hover:text-sand active:scale-95 disabled:opacity-40"
            >
              <TareeqArrowLeft size={16} className="flip-rtl" />
            </button>
            <button
              type="button"
              onClick={goNextExplicit}
              disabled={!selected.trim() || Boolean(exiting)}
              className="btn-v2 btn-v2--primary flex-1"
              data-size="lg"
            >
              {isLastQuestion ? "Finish" : "Next"}
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
          </footer>
        ) : (
          <p className="flex items-center justify-between gap-2 text-eyebrow text-sand/45">
            <span className="truncate">
              {confirming ? "Saving…" : "Tap to continue"}
            </span>
            <button
              type="button"
              onClick={goPrevious}
              disabled={Boolean(exiting)}
              className="inline-flex items-center gap-1 text-sand/55 transition hover:text-sand disabled:opacity-40"
            >
              <TareeqArrowLeft size={11} className="flip-rtl" showAccent={false} />
              Previous
            </button>
          </p>
        )}
      </section>
    </>
  );
}
