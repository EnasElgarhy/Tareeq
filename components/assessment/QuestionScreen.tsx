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
import { getLocalizedText, getQuestionPath } from "@/lib/assessment/questions";
import { computeScore, type Question } from "@/lib/scoring";

type AudioState =
  | "idle"
  | "loading"
  | "playing"
  | "muted"
  | "locked"
  | "unavailable";
type ExitDirection = "forward" | "back" | null;
const KAI_AUDIO_FALLBACK_EXTENSIONS = ["m4a", "mp3"] as const;

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
  menaCountries,
  restOfWorldCountries,
}: QuestionScreenProps) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lipSyncFrameRef = useRef<number | null>(null);
  const lipSyncLevelRef = useRef(0);
  const autoPlaybackQuestionRef = useRef<string | null>(null);
  const audioFallbackIndexRef = useRef(0);

  const [selected, setSelected] = useState("");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [exiting, setExiting] = useState<ExitDirection>(null);
  const [pendingInterstitial, setPendingInterstitial] =
    useState<Interstitial | null>(null);

  const [soundOn, setSoundOn] = useState(true);
  const [soundPreferenceReady, setSoundPreferenceReady] = useState(false);
  const [voiceRequiresGesture, setVoiceRequiresGesture] = useState(false);
  const [voiceUnlocked, setVoiceUnlocked] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [speed, setSpeed] = useState(1);
  const [mouthOpen, setMouthOpen] = useState(0);

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
  const title = getLocalizedText(question.title);
  const activeNarrationId = pendingInterstitial?.audioId ?? question.externalId;
  const activeNarrationKind = pendingInterstitial ? "section" : "question";

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

  const kaiScene = useMemo(
    () =>
      KAI_QUESTION_SCENES[index % KAI_QUESTION_SCENES.length] ??
      DEFAULT_KAI_QUESTION_SCENE,
    [index],
  );

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
    const touchFirstDevice =
      window.matchMedia("(hover: none), (pointer: coarse)").matches ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
    setVoiceRequiresGesture(touchFirstDevice);
    setVoiceUnlocked(!touchFirstDevice);
    setSoundPreferenceReady(true);
  }, []);

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
          audioRef.current?.pause();
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
          router.push("/register");
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
    audioRef.current?.pause();
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
        router.push("/register");
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

  const stopLipSync = useCallback(() => {
    if (lipSyncFrameRef.current != null) {
      window.cancelAnimationFrame(lipSyncFrameRef.current);
      lipSyncFrameRef.current = null;
    }
    lipSyncLevelRef.current = 0;
    setMouthOpen(0);
  }, []);

  const ensureLipSyncGraph = useCallback((audio: HTMLAudioElement) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const context = audioContextRef.current;
    if (!audioSourceRef.current) {
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.32;
      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);
      audioSourceRef.current = source;
      analyserRef.current = analyser;
    }
    return context;
  }, []);

  const startLipSync = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    if (lipSyncFrameRef.current != null) {
      window.cancelAnimationFrame(lipSyncFrameRef.current);
    }

    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const value of data) {
        const centered = (value - 128) / 128;
        sum += centered * centered;
      }
      const rms = Math.sqrt(sum / data.length);
      const rawLevel = Math.min(1, Math.max(0, (rms - 0.018) * 13));
      const nextLevel = lipSyncLevelRef.current * 0.58 + rawLevel * 0.42;
      lipSyncLevelRef.current = nextLevel;
      setMouthOpen((current) =>
        Math.abs(current - nextLevel) > 0.018 ? nextLevel : current,
      );
      lipSyncFrameRef.current = window.requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const playQuestionAudio = useCallback(
    async (
      mode: "auto" | "replay" | "toggle" = "toggle",
      forceSound = false,
      userGesture = false,
    ) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (!soundOn && !forceSound) return;
      if (userGesture) setVoiceUnlocked(true);
      if (voiceRequiresGesture && !voiceUnlocked && !userGesture) {
        setAudioState("locked");
        stopLipSync();
        return;
      }
      if (mode === "toggle" && audioState === "playing") {
        audio.pause();
        setAudioState("idle");
        return;
      }
      setAudioState("loading");
      audioFallbackIndexRef.current = 0;
      const nextSrc = `/api/kai-tts/${encodeURIComponent(activeNarrationId)}`;
      if (!audio.getAttribute("src")?.endsWith(nextSrc)) {
        audio.src = nextSrc;
      }
      audio.currentTime = 0;
      audio.playbackRate = speed;
      try {
        const context = ensureLipSyncGraph(audio);
        if (context.state === "suspended") await context.resume();
        await audio.play();
        setAudioState("playing");
      } catch {
        setAudioState("unavailable");
        stopLipSync();
      }
    },
    [
      audioState,
      activeNarrationId,
      ensureLipSyncGraph,
      soundOn,
      speed,
      stopLipSync,
      voiceRequiresGesture,
      voiceUnlocked,
    ],
  );

  const handleAudioError = useCallback(() => {
    const audio = audioRef.current;
    if (
      audio &&
      soundOn &&
      audioFallbackIndexRef.current < KAI_AUDIO_FALLBACK_EXTENSIONS.length
    ) {
      const extension =
        KAI_AUDIO_FALLBACK_EXTENSIONS[audioFallbackIndexRef.current];
      audioFallbackIndexRef.current += 1;
      audio.src = `/audio/${activeNarrationId}.${extension}`;
      audio.currentTime = 0;
      audio.playbackRate = speed;
      void audio
        .play()
        .then(() => setAudioState("playing"))
        .catch(() => {
          stopLipSync();
          setAudioState("unavailable");
        });
      return;
    }
    stopLipSync();
    setAudioState("unavailable");
  }, [activeNarrationId, soundOn, speed, stopLipSync]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    stopLipSync();
    autoPlaybackQuestionRef.current = null;
    setAudioState(soundOn ? "idle" : "muted");
  }, [activeNarrationId, soundOn, stopLipSync]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
  }, [speed, audioState]);

  useEffect(() => {
    return () => {
      stopLipSync();
      void audioContextRef.current?.close();
    };
  }, [stopLipSync]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    window.localStorage.setItem("tareeq:sound", next ? "on" : "off");
    if (!next) {
      audioRef.current?.pause();
      stopLipSync();
      setAudioState("muted");
    } else {
      setAudioState("idle");
      window.setTimeout(() => {
        void playQuestionAudio("replay", true, true);
      }, 0);
    }
  }

  useEffect(() => {
    if (!soundPreferenceReady || !soundOn || exiting) return;
    if (autoPlaybackQuestionRef.current === activeNarrationId) return;
    autoPlaybackQuestionRef.current = activeNarrationId;
    if (voiceRequiresGesture && !voiceUnlocked) {
      setAudioState("locked");
      return;
    }
    const delay =
      activeNarrationKind === "section"
        ? 180
        : prefersReducedMotion()
          ? 80
          : 520;
    const timeout = window.setTimeout(() => {
      void playQuestionAudio("auto");
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [
    activeNarrationId,
    activeNarrationKind,
    exiting,
    playQuestionAudio,
    soundOn,
    soundPreferenceReady,
    voiceRequiresGesture,
    voiceUnlocked,
  ]);

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
          audioState={audioState}
          mouthOpen={mouthOpen}
          soundOn={soundOn}
          onReplay={() => playQuestionAudio("replay", false, true)}
          onToggleSound={toggleSound}
          onDismiss={dismissInterstitial}
        />
      ) : null}

      <section
        key={question.externalId}
        aria-labelledby="question-text"
        aria-busy={Boolean(exiting)}
        className={`flex flex-1 flex-col ${
          isDenseChoice ? "gap-2" : "gap-3"
        } ${exitClass}`}
      >
        <audio
          ref={audioRef}
          preload="none"
          playsInline
          onEnded={() => {
            stopLipSync();
            setAudioState(soundOn ? "idle" : "muted");
          }}
          onPlay={startLipSync}
          onPause={() => {
            stopLipSync();
            if (audioState === "playing")
              setAudioState(soundOn ? "idle" : "muted");
          }}
          onError={handleAudioError}
        />

        {/* Hero — aurora + Kai + question bubble below */}
        <div className="flex flex-col items-center gap-2.5">
          <div
            className={`relative flex items-center justify-center ${
              isDenseChoice ? "h-[132px] w-[132px]" : "h-[156px] w-[156px]"
            }`}
          >
            <QuestionKaiScene scene={kaiScene} />
            <div className="anim-aura-bloom absolute inset-0">
              <KaiAuraV2 size="100%" />
            </div>
            <div
              aria-label="Kai, your guide"
              role="img"
              className="anim-kai-pop relative"
            >
              <div className="anim-avatar-bob">
                <Kai
                  mood={liveMood}
                  mouthOpen={mouthOpen}
                  size={isDenseChoice ? 104 : 120}
                />
              </div>
            </div>
          </div>

          {/* Question bubble */}
          <div
            className={`bubble anim-bubble-in w-full max-w-[420px] !px-4 ${
              isDenseChoice ? "!py-2.5" : "!py-3"
            }`}
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
                fontSize: isDenseChoice
                  ? "clamp(15px, 0.92rem + 0.9vw, 20px)"
                  : "clamp(16px, 0.95rem + 1.1vw, 22px)",
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
            className={[
              "inline-flex size-9 items-center justify-center rounded-full transition active:scale-95",
              soundOn
                ? "bg-gold-gradient text-carbon shadow-gold-glow"
                : "glass-tile text-sand/80 hover:text-sand",
            ].join(" ")}
            aria-label={soundOn ? "Mute narration" : "Unmute narration"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
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
            onClick={() => playQuestionAudio("toggle", false, true)}
            disabled={!soundOn}
            className={[
              "inline-flex items-center justify-center rounded-full transition hover:text-sand active:scale-95 disabled:opacity-40",
              audioState === "locked"
                ? "h-8 bg-gold-gradient px-3 text-[11px] font-semibold text-carbon shadow-gold-glow"
                : "glass-tile size-8 text-sand/75",
            ].join(" ")}
            aria-label={
              audioState === "locked"
                ? "Start Kai voice"
                : audioState === "playing"
                  ? "Pause narration"
                  : "Replay question"
            }
          >
            {audioState === "locked" ? (
              "Start voice"
            ) : audioState === "playing" ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <rect x="6.5" y="5" width="3.5" height="14" rx="1.4" />
                <rect x="14" y="5" width="3.5" height="14" rx="1.4" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path
                  d="M17.5 7.1 C15.9 5.8 13.9 5 11.8 5 C7.5 5 4 8.5 4 12.8 C4 17.1 7.5 20.6 11.8 20.6 C15.5 20.6 18.6 18 19.4 14.6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M18.2 3.8 V7.8 H14.2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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
              <p className="flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sand/45">
                <span>Choose 1 of {optionCount}</span>
                <span>
                  {optionCount === 2 ? "Two paths" : optionRangeLabel}
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
                      `anim-option-in group relative flex items-center gap-2.5 rounded-xl px-3 text-start transition ${
                        isDenseChoice
                          ? "min-h-[42px] py-1.5"
                          : "min-h-[44px] py-2"
                      }`,
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
              <TareeqArrowLeft
                size={11}
                className="flip-rtl"
                showAccent={false}
              />
              Previous
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
