"use client";

import { ArrowLeft, ArrowRight, Loader2, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  completeLocalAssessment,
  ensureLocalAssessment,
  readLocalAssessment,
  saveLocalAnswer,
} from "@/lib/assessment/progress";
import {
  getLocalizedText,
  getPillarLabel,
  getQuestionPath,
} from "@/lib/assessment/questions";
import { computeScore, type Question } from "@/lib/scoring";

type AudioState = "idle" | "loading" | "playing" | "muted" | "unavailable";

type QuestionScreenProps = {
  question: Question;
  questions: Question[];
  index: number;
  totalQuestions: number;
  menaCountries: string[];
  restOfWorldCountries: string[];
};

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
  const [soundOn, setSoundOn] = useState(true);
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const isLastQuestion = index === totalQuestions - 1;
  const isSelect = question.kind === "select";
  const title = getLocalizedText(question.title);
  const selectedOption = question.options.find(
    (option) => option.letter === selected,
  );

  useEffect(() => {
    ensureLocalAssessment();
    setSelected(readLocalAssessment()?.answers[question.externalId] ?? "");
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
    function onKeyDown(event: KeyboardEvent) {
      if (isSelect) return;
      if (event.key === "Enter" && selected) {
        event.preventDefault();
        goNext();
        return;
      }

      const asNumber = Number.parseInt(event.key, 10);
      const option = question.options[asNumber - 1];
      if (!option) return;

      event.preventDefault();
      choose(option.letter);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const countryOptions = useMemo(
    () => [
      { label: "Middle East & North Africa", options: menaCountries },
      { label: "Other", options: restOfWorldCountries },
    ],
    [menaCountries, restOfWorldCountries],
  );

  async function playQuestionAudio() {
    const audio = audioRef.current;
    if (!audio) return;

    if (!soundOn) {
      setAudioState("muted");
      return;
    }

    setAudioState("loading");
    audio.src = `/audio/${question.externalId}.mp3`;
    audio.currentTime = 0;

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

  function choose(value: string) {
    setSelected(value);
    saveLocalAnswer(question.externalId, value, index);
  }

  function goPrevious() {
    router.push(index > 0 ? getQuestionPath(index - 1) : "/start");
  }

  function goNext() {
    if (!selected) return;

    const progress = saveLocalAnswer(question.externalId, selected, index);

    if (!isLastQuestion) {
      router.push(getQuestionPath(index + 1));
      return;
    }

    const result = computeScore(progress.answers, questions);
    completeLocalAssessment(result, index);
    router.push("/start?complete=1");
  }

  return (
    <section className="flex flex-1 flex-col">
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

      <div className="flex flex-1 flex-col rounded-[1.35rem] border border-glass-border bg-glass-strong p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-text-60">
            <span className="size-2 rounded-full bg-accent-orange shadow-[0_0_12px_var(--accent-orange)]" />
            {getPillarLabel(question)}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className="inline-flex size-9 items-center justify-center rounded-full border border-glass-border bg-glass text-text-80 transition active:scale-95"
              aria-label={soundOn ? "Switch to text only" : "Turn narration on"}
              title={soundOn ? "Switch to text only" : "Turn narration on"}
            >
              {soundOn ? (
                <Volume2 aria-hidden="true" size={17} strokeWidth={2.2} />
              ) : (
                <VolumeX aria-hidden="true" size={17} strokeWidth={2.2} />
              )}
            </button>
            <button
              type="button"
              onClick={playQuestionAudio}
              disabled={!soundOn || audioState === "loading"}
              className={
                audioState === "playing"
                  ? "inline-flex size-9 items-center justify-center rounded-full border border-transparent bg-grad-warm text-white shadow-[0_8px_24px_rgba(255,61,131,0.35)] transition active:scale-95"
                  : "inline-flex size-9 items-center justify-center rounded-full border border-glass-border bg-glass text-text-80 transition disabled:opacity-45 active:scale-95"
              }
              aria-label="Play question narration"
              title="Play question narration"
            >
              {audioState === "loading" ? (
                <Loader2
                  aria-hidden="true"
                  className="animate-spin"
                  size={17}
                  strokeWidth={2.2}
                />
              ) : (
                <Volume2 aria-hidden="true" size={17} strokeWidth={2.2} />
              )}
            </button>
            <div className="rounded-full border border-glass-border bg-glass px-2.5 py-1 text-xs font-semibold text-text-60">
              {question.externalId}
            </div>
          </div>
        </div>

        {audioState === "unavailable" ? (
          <p className="-mt-1 mb-3 rounded-xl border border-glass-border bg-glass px-3 py-2 text-xs leading-5 text-text-60">
            Narration file missing for this prompt. Bake audio into{" "}
            <span className="font-semibold text-text-80">public/audio</span>.
          </p>
        ) : null}

        <h1 className="font-display text-[1.42rem] font-medium leading-[1.22] tracking-normal text-text-100">
          {title}
        </h1>

        {isSelect ? (
          <div className="mt-7">
            <label
              htmlFor="country"
              className="mb-2 block text-xs font-bold uppercase tracking-[0.11em] text-text-60"
            >
              Country
            </label>
            <select
              id="country"
              value={selected}
              onChange={(event) => choose(event.target.value)}
              className="min-h-14 w-full rounded-2xl border border-glass-border bg-bg-1 px-4 text-base text-text-100 outline-none ring-accent-orange/60 transition focus:ring-2"
            >
              <option value="" disabled>
                Select your country...
              </option>
              {countryOptions.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-7 grid gap-3">
            {question.options.map((option) => {
              const active = option.letter === selected;
              const binary = question.kind === "binary";

              return (
                <button
                  type="button"
                  key={option.letter}
                  onClick={() => choose(option.letter)}
                  className={
                    active
                      ? "flex min-h-16 items-stretch gap-3 rounded-2xl border border-transparent bg-grad-warm p-3 text-start text-white shadow-[0_10px_30px_rgba(255,61,131,0.35)] transition active:scale-[0.99]"
                      : "flex min-h-16 items-stretch gap-3 rounded-2xl border border-glass-border bg-glass p-3 text-start text-text-80 transition hover:bg-glass-strong active:scale-[0.99]"
                  }
                  aria-pressed={active}
                >
                  {binary ? null : (
                    <span
                      className={
                        active
                          ? "grid size-9 shrink-0 place-items-center rounded-full border border-white/35 bg-white/20 text-sm font-bold text-white"
                          : "grid size-9 shrink-0 place-items-center rounded-full border border-glass-border bg-white/10 text-sm font-bold text-text-80"
                      }
                    >
                      {option.letter}
                    </span>
                  )}
                  <span className="self-center text-[0.96rem] leading-6">
                    {getLocalizedText(option.text)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-auto pt-6">
          {selectedOption ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-text-40">
              Selected {selectedOption.letter}
            </p>
          ) : null}
        </div>
      </div>

      <footer className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={goPrevious}
          className="inline-flex size-14 shrink-0 items-center justify-center rounded-full border border-glass-border bg-glass text-text-100 transition active:scale-95"
          aria-label="Previous question"
        >
          <ArrowLeft aria-hidden="true" size={19} strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!selected}
          className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-grad-warm px-5 text-sm font-bold uppercase tracking-[0.04em] text-white shadow-[0_14px_40px_rgba(255,61,131,0.42)] transition disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none active:scale-[0.99]"
        >
          {isLastQuestion ? "Finish" : "Next"}
          <ArrowRight aria-hidden="true" size={18} strokeWidth={2.4} />
        </button>
      </footer>
    </section>
  );
}
