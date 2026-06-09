"use client";

/**
 * UI sound design — Web Audio API.
 *
 * Tones are generated procedurally so we ship zero audio assets for the
 * micro-interactions. Each cue is short (<200ms), gentle, and tuned to the
 * brand: warm sines for selection, a soft third for confirm, an upward
 * glide for advance, downward for back.
 *
 * Honors the user's "tareeq:sound" toggle and prefers-reduced-motion.
 */

type ToneOptions = {
  freq: number;
  /** Slide target freq, optional */
  toFreq?: number;
  /** Duration in seconds */
  duration: number;
  type?: OscillatorType;
  /** Peak gain (linear, 0–1). Default 0.05. */
  gain?: number;
  /** Delay before play, in ms */
  delay?: number;
};

let ctx: AudioContext | null = null;
const SOUND_PREF_KEY = "tareeq:sound";

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOUND_PREF_KEY) !== "off";
}

export function defaultVoiceOnForAssessmentStart(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_PREF_KEY, "on");
}

function play(opts: ToneOptions): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") {
    // resume is async but we don't need to await — the schedule still lands
    c.resume().catch(() => undefined);
  }

  const start = c.currentTime + (opts.delay ?? 0) / 1000;
  const dur = opts.duration;
  const osc = c.createOscillator();
  const g = c.createGain();

  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, start);
  if (opts.toFreq != null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(opts.toFreq, 1),
      start + dur,
    );
  }

  const peak = opts.gain ?? 0.05;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

export const uiSounds = {
  /** Light tick on hover-commit or option select (pre-confirm). */
  select(): void {
    if (!isSoundEnabled()) return;
    play({ freq: 660, duration: 0.07, type: "sine", gain: 0.07 });
  },
  /** Two-note major-third — commits the selected option. */
  confirm(): void {
    if (!isSoundEnabled()) return;
    play({ freq: 523.25, duration: 0.14, type: "sine", gain: 0.1 });
    play({
      freq: 783.99,
      duration: 0.16,
      type: "sine",
      gain: 0.085,
      delay: 70,
    });
  },
  /** Upward glide — moving forward to next question. */
  advance(): void {
    if (!isSoundEnabled()) return;
    play({
      freq: 880,
      toFreq: 1320,
      duration: 0.2,
      type: "sine",
      gain: 0.075,
    });
  },
  /** Downward glide — back nav. */
  back(): void {
    if (!isSoundEnabled()) return;
    play({
      freq: 660,
      toFreq: 440,
      duration: 0.18,
      type: "sine",
      gain: 0.07,
    });
  },
  /** Soft whoosh — screen-to-screen transition.
   *  A quick triangle-wave downward glide; lands between confirm and
   *  the next screen's first interaction. */
  transition(): void {
    if (!isSoundEnabled()) return;
    play({
      freq: 1100,
      toFreq: 520,
      duration: 0.22,
      type: "triangle",
      gain: 0.055,
    });
    play({
      freq: 220,
      toFreq: 110,
      duration: 0.18,
      type: "sine",
      gain: 0.04,
      delay: 40,
    });
  },
  /** Resolved chord — assessment complete + interstitial enter. */
  complete(): void {
    if (!isSoundEnabled()) return;
    play({ freq: 523.25, duration: 0.24, type: "sine", gain: 0.09 });
    play({
      freq: 659.25,
      duration: 0.24,
      type: "sine",
      gain: 0.08,
      delay: 90,
    });
    play({
      freq: 783.99,
      duration: 0.32,
      type: "sine",
      gain: 0.08,
      delay: 180,
    });
  },
};

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
