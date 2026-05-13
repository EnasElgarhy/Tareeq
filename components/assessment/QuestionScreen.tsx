"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TareeqArrowLeft,
  TareeqArrowRight,
  TareeqVolumeOff,
  TareeqVolumeOn,
} from "@/components/brand/icons";
import { AnswerIcon } from "@/components/brand/AnswerIcons";
import { Kai, type KaiMood } from "@/components/brand/Kai";
import { DidYouKnow } from "@/components/onboarding/DidYouKnow";
import { Button } from "@/components/primitives/Button";
import { PlayButton } from "@/components/primitives/PlayButton";
import { SelectPill } from "@/components/primitives/SelectPill";
import { SpeechBubble } from "@/components/primitives/SpeechBubble";
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

/** Per-letter accent + Kai mood — each option has its own fingerprint. */
const OPTION_PALETTE = [
  { accent: "#FF6B47", mood: "warm" as KaiMood },
  { accent: "#5BD6E8", mood: "curious" as KaiMood },
  { accent: "#B8A5D9", mood: "thinking" as KaiMood },
  { accent: "#FF8252", mood: "encouraging" as KaiMood },
  { accent: "#E5DAF5", mood: "listening" as KaiMood },
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
  /** When set, render the interstitial overlay instead of advancing. */
  const [pendingInterstitial, setPendingInterstitial] =
    useState<Interstitial | null>(null);

  const [soundOn, setSoundOn] = useState(true);
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [speed, setSpeed] = useState(1);

  const isLastQuestion = index === totalQuestions - 1;
  const isSelect = question.kind === "select";
  const isText = question.kind === "text";
  /** Both "select" and "text" require an explicit Next click. */
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
    // Subtle whoosh on screen change — only when the user has already
    // answered something (i.e. mid-flow), so cold loads stay silent.
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

  // ---------- Navigation orchestration ----------

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

      // Is this a "did you know" milestone? Show the interstitial in
      // place of the route change. The interstitial's own CTA pushes
      // the route forward.
      const milestone = !isLastQuestion ? findInterstitialFor(index) : null;
      const shouldShow = milestone && !hasSeenInterstitial(milestone.key);

      window.setTimeout(() => {
        if (shouldShow) {
          markInterstitialSeen(milestone.key);
          setConfirming(null); // release the lock so dismiss can navigate
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

  /** Dismiss the interstitial and continue to the next question. */
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
      () => router.push(index > 0 ? getQuestionPath(index - 1) : "/start"),
      prefersReducedMotion() ? 60 : 220,
    );
  }

  function goNextFromSelect() {
    if (!selected || exiting) return;
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
      // Text questions own the keyboard — typing should reach the
      // textarea unhindered, and Enter inserts a newline.
      if (isText) return;
      if (isSelect) {
        if (event.key === "Enter" && selected) {
          event.preventDefault();
          goNextFromSelect();
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

  // ---------- Audio narration ----------

  async function playQuestionAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!soundOn) {
      setAudioState("muted");
      return;
    }
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

  const playState =
    audioState === "playing"
      ? "playing"
      : audioState === "loading"
        ? "loading"
        : "idle";

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
      className={`flex flex-1 flex-col gap-5 pt-6 ${exitClass}`}
    >
      <audio
        ref={audioRef}
        preload="none"
        playsInline
        onEnded={() => setAudioState(soundOn ? "idle" : "muted")}
        onPause={() => {
          if (audioState === "playing") {
            setAudioState(soundOn ? "idle" : "muted");
          }
        }}
        onError={() => setAudioState("unavailable")}
      />

      {/* Centered stack: speech bubble → character → audio controls.
       *  The bubble sits ABOVE Kai with a centered tail pointing DOWN —
       *  graphic-novel "speech rising from the character" pattern.
       *  No avatar card — Kai floats with a soft atmospheric glow. */}
      <div className="flex flex-col items-center">
        <SpeechBubble
          id="question-text"
          tight
          tailPosition="center"
          tailEdge="bottom"
          surface="light"
          className="anim-bubble-in relative z-10 w-full max-w-[420px] text-start"
        >
          {title}
        </SpeechBubble>

        <div
          aria-label="Kai, your guide"
          role="img"
          className="anim-avatar-in anim-avatar-bob relative -mt-1 flex items-end justify-center"
        >
          {/* Soft lavender atmospheric glow — replaces the old coral box.
           *  Stays well behind Kai so she reads as floating on the page. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 -m-8 rounded-full bg-lavender-mist/35 blur-2xl"
          />
          <Kai mood={liveMood} size={132} className="relative" />
        </div>
      </div>

      {/* Spacer before the audio controls */}
      <div className="pt-1" />

        {/* The 3 audio buttons — mute · play · speed */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={toggleSound}
            className="inline-flex size-10 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/70 shadow-sm transition hover:bg-mist/40"
            aria-label={soundOn ? "Mute narration" : "Unmute narration"}
          >
            {soundOn ? (
              <TareeqVolumeOn size={16} showAccent={false} />
            ) : (
              <TareeqVolumeOff size={16} showAccent={false} />
            )}
          </button>
          <PlayButton
            state={playState}
            onClick={playQuestionAudio}
            disabled={!soundOn}
            className="!size-12"
          />
          <button
            type="button"
            onClick={() => {
              const cycle = [1, 1.25, 1.5, 0.75];
              const next = cycle[(cycle.indexOf(speed) + 1) % cycle.length];
              if (next != null) setSpeed(next);
            }}
            aria-label={`Playback speed ${speed}× — tap to change`}
            className="inline-flex h-10 items-center justify-center rounded-full border border-ink/10 bg-white px-3 text-[13px] font-semibold text-ink/75 shadow-sm transition hover:bg-mist/40"
          >
            {speed}×
          </button>
        </div>

      {audioState === "unavailable" ? (
        <p
          role="status"
          className="rounded-md border border-ink/10 bg-white/70 px-3 py-1.5 text-center text-caption text-ink/60"
        >
          Narration unavailable — keep reading.
        </p>
      ) : null}

      {/* Answer surface */}
      <div className="flex flex-1 flex-col gap-2 pt-2">
        {isSelect ? (
          <SelectPill
            placeholder="Select your country..."
            options={countryOptions}
            value={selected}
            onChange={(e) => chooseFromSelect(e.target.value)}
          />
        ) : isText ? (
          /* Open-text reflection — generous textarea + counter */
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="reflect-input" className="sr-only">
              Your reflection
            </label>
            <textarea
              id="reflect-input"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              placeholder="Type your reflection..."
              rows={5}
              maxLength={600}
              className="anim-bubble-in w-full flex-1 resize-none rounded-lg border border-ink/10 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink/35 shadow-[0_1px_2px_rgba(13,27,33,0.03)] transition focus-visible:border-coral/60 focus-visible:shadow-[0_0_0_3px_rgba(255,107,71,0.18)] focus-visible:outline-none"
              autoFocus
            />
            <p className="flex items-center justify-between text-caption text-ink/45">
              <span>No wrong answers — write what comes to mind.</span>
              <span className="tabular-nums">{selected.length}/600</span>
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {question.options.map((option, optionIdx) => {
              const palette =
                OPTION_PALETTE[optionIdx % OPTION_PALETTE.length] ??
                OPTION_PALETTE[0]!;
              const active = option.letter === selected;
              const isConfirming = option.letter === confirming;
              const isHovered = hoveredIdx === optionIdx;
              const binary = question.kind === "binary";
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
                        ? `inset 4px 0 0 0 ${palette.accent}, 0 8px 24px rgba(255,107,71,0.28)`
                        : isHovered
                          ? `inset 3px 0 0 0 ${palette.accent}, 0 2px 6px rgba(13,27,33,0.05)`
                          : `inset 2px 0 0 0 ${palette.accent}66, 0 1px 2px rgba(13,27,33,0.03)`,
                  }}
                  className={[
                    "anim-option-in group relative flex min-h-[52px] items-center gap-3 rounded-lg border px-4 py-3 ps-5 text-start transition active:scale-[0.99]",
                    "disabled:opacity-45 disabled:pointer-events-none",
                    isConfirming
                      ? "anim-option-confirm border-coral/60 bg-coral-gradient text-cream"
                      : active
                        ? "border-coral/60 bg-coral-gradient text-cream"
                        : "border-ink/8 bg-white text-ink hover:border-ink/15 hover:bg-white",
                  ].join(" ")}
                >
                  {!binary ? (
                    <span
                      aria-hidden="true"
                      className={[
                        "relative shrink-0 transition-transform",
                        isHovered || active || isConfirming
                          ? "scale-105"
                          : "",
                      ].join(" ")}
                      style={
                        isHovered && !active && !isConfirming
                          ? {
                              filter: "drop-shadow(0 4px 8px rgba(13,27,33,0.15))",
                            }
                          : undefined
                      }
                    >
                      <AnswerIcon position={optionIdx} size={36} />
                    </span>
                  ) : null}
                  <span className="flex-1 text-[14px] leading-5">
                    {getLocalizedText(option.text)}
                  </span>
                  <span
                    aria-hidden="true"
                    className={[
                      "transition-all",
                      isConfirming || active ? "text-cream/85" : "text-ink/35",
                      isHovered || isConfirming || active
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-1",
                    ].join(" ")}
                  >
                    <TareeqArrowRight size={14} showAccent={false} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {isExplicit ? (
        <footer className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={goPrevious}
            aria-label="Previous question"
            disabled={Boolean(exiting)}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-ink transition hover:bg-mist/40 active:scale-95 disabled:opacity-40"
          >
            <TareeqArrowLeft size={16} className="flip-rtl" />
          </button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={goNextFromSelect}
            disabled={!selected.trim() || Boolean(exiting)}
            iconRight={<TareeqArrowRight size={18} />}
          >
            {isLastQuestion ? "Finish" : "Next"}
          </Button>
        </footer>
      ) : (
        <p className="flex items-center justify-between gap-2 pt-1 text-caption text-ink/45">
          <span>
            {confirming
              ? "Saving..."
              : "Tap to continue · or press 1, 2, 3"}
          </span>
          <button
            type="button"
            onClick={goPrevious}
            disabled={Boolean(exiting)}
            className="inline-flex items-center gap-1 text-ink/55 transition hover:text-ink disabled:opacity-40"
          >
            <TareeqArrowLeft
              size={12}
              showAccent={false}
              className="flip-rtl"
            />
            Previous
          </button>
        </p>
      )}
    </section>
    </>
  );
}
