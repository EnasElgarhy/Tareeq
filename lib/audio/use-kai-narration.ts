"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { computeKaiMouthLevel } from "@/lib/audio/lip-sync";

/**
 * useKaiNarration — drop-in voice + lip-sync hook for any screen that
 * wants to play a Kai narration clip and animate her mouth.
 *
 * Extracted from the QuestionScreen audio pipeline so both /q/* and
 * /intro (and any future screen) can share the same Web Audio setup
 * for lip-sync without re-implementing the rAF graph.
 *
 * Auto-plays on mount when `autoPlay` is true, falls back gracefully
 * on touch devices that require a user gesture (sets state to
 * "locked" and waits for `play()` to be called explicitly), and
 * cleans up its AudioContext / animation frame on unmount.
 */

const FALLBACK_EXTENSIONS = ["m4a", "mp3"] as const;

function getNarrationSrc(
  audioId: string,
  fallbackIndex: number,
  locale?: string,
) {
  if (fallbackIndex === 0) {
    const query = locale ? `?locale=${encodeURIComponent(locale)}` : "";
    return `/api/kai-tts/${encodeURIComponent(audioId)}${query}`;
  }

  const ext = FALLBACK_EXTENSIONS[fallbackIndex - 1] ?? "mp3";
  return `/audio/${audioId}.${ext}`;
}

export type KaiNarrationState =
  | "idle"
  | "loading"
  | "playing"
  | "ended"
  | "muted"
  | "locked"
  | "unavailable";

interface UseKaiNarrationOptions {
  /** Filename stem under public/audio/ — e.g. "kai_intro" for kai_intro.mp3 */
  audioId: string;
  /** Try to play as soon as the audio element mounts. Defaults to true. */
  autoPlay?: boolean;
  /** Persisted sound preference. When false, narration never plays. */
  soundOn?: boolean;
  /** Active locale — selects the localized text + voice for live TTS. */
  locale?: string;
  /** Called once the clip ends naturally (not on pause/stop). */
  onEnded?: () => void;
}

interface UseKaiNarrationResult {
  /** Attach to a hidden <audio /> element on the page. */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** 0-1 lip-sync level, drive Kai's `mouthOpen` with this. */
  mouthOpen: number;
  /** Current playback state — drive UI affordances with this. */
  audioState: KaiNarrationState;
  /** True when the device needs a user tap before audio can play. */
  voiceRequiresGesture: boolean;
  /** Set true after the first user gesture so audio can play. */
  voiceUnlocked: boolean;
  /** Trigger / resume playback. Pass `userGesture` true from a click. */
  play: (userGesture?: boolean) => Promise<void>;
  /** Pause + freeze the mouth. */
  pause: () => void;
  /** Stop and rewind. */
  reset: () => void;
}

export function useKaiNarration({
  audioId,
  autoPlay = true,
  soundOn = true,
  locale,
  onEnded,
}: UseKaiNarrationOptions): UseKaiNarrationResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lipSyncFrameRef = useRef<number | null>(null);
  const lipSyncLevelRef = useRef(0);
  const fallbackIdxRef = useRef(0);
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  const [mouthOpen, setMouthOpen] = useState(0);
  const [audioState, setAudioState] = useState<KaiNarrationState>("idle");
  const [voiceRequiresGesture, setVoiceRequiresGesture] = useState(false);
  const [voiceUnlocked, setVoiceUnlocked] = useState(false);

  // Detect touch-first devices on mount. Mobile Safari requires a user
  // gesture before audio can play; desktops do not.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const touchFirst =
      window.matchMedia("(hover: none), (pointer: coarse)").matches ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
    setVoiceRequiresGesture(touchFirst);
    setVoiceUnlocked(!touchFirst);
  }, []);

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
      // Webkit fallback for older Safari
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      audioContextRef.current = new Ctor();
    }
    const context = audioContextRef.current;
    if (!audioSourceRef.current) {
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.18;
      try {
        const source = context.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(context.destination);
        audioSourceRef.current = source;
        analyserRef.current = analyser;
      } catch {
        analyserRef.current = null;
      }
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
      const nextLevel = computeKaiMouthLevel(
        data,
        lipSyncLevelRef.current,
        performance.now(),
      );
      lipSyncLevelRef.current = nextLevel;
      setMouthOpen((current) =>
        Math.abs(current - nextLevel) > 0.012 ? nextLevel : current,
      );
      lipSyncFrameRef.current = window.requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const play = useCallback(
    async (userGesture = false) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (!soundOn) {
        setAudioState("muted");
        return;
      }
      if (userGesture) setVoiceUnlocked(true);
      if (voiceRequiresGesture && !voiceUnlocked && !userGesture) {
        setAudioState("locked");
        return;
      }

      try {
        const nextSrc = getNarrationSrc(
          audioId,
          fallbackIdxRef.current,
          locale,
        );
        const needsSourceLoad =
          !audio.getAttribute("src")?.endsWith(nextSrc) ||
          audio.readyState === 0;
        if (needsSourceLoad) {
          audio.src = nextSrc;
          audio.load();
        }
        setAudioState("loading");
        const ctx = ensureLipSyncGraph(audio);
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (ctx && ctx.state === "suspended") {
          void ctx.resume().catch(() => {});
        }
        await playPromise;
        setAudioState("playing");
        startLipSync();
      } catch {
        // Try local baked files if the live TTS route is unavailable.
        if (fallbackIdxRef.current < FALLBACK_EXTENSIONS.length) {
          fallbackIdxRef.current += 1;
          await play(userGesture);
          return;
        }
        setAudioState("unavailable");
        stopLipSync();
      }
    },
    [audioId, ensureLipSyncGraph, locale, soundOn, startLipSync, stopLipSync, voiceRequiresGesture, voiceUnlocked],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    stopLipSync();
    setAudioState("idle");
  }, [stopLipSync]);

  const reset = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    stopLipSync();
    setAudioState("idle");
  }, [stopLipSync]);

  // Wire DOM events from the audio element so pause/end/error update state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      stopLipSync();
      setAudioState("ended");
      onEndedRef.current?.();
    };
    const handlePause = () => {
      if (audio.ended) return;
      stopLipSync();
      setAudioState((s) => (s === "playing" ? "idle" : s));
    };
    const handleError = () => {
      if (fallbackIdxRef.current < FALLBACK_EXTENSIONS.length) {
        fallbackIdxRef.current += 1;
        void play(true);
        return;
      }
      setAudioState("unavailable");
      stopLipSync();
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
    // audioRef.current is a ref — won't change between mounts
  }, [play, stopLipSync]);

  // Auto-play on mount once we know the gesture requirement.
  //
  //  · Desktop / non-touch: play immediately.
  //  · Touch / mobile: still try to play immediately first — many
  //    browsers (notably Safari 17+ in standalone PWA mode and
  //    Chrome on Android with high engagement score) will allow it.
  //    If the browser blocks it, we install one-shot listeners on
  //    `document` for the first ANY interaction (pointerdown,
  //    touchstart, keydown, click, scroll). The user does not need
  //    to find the Start-voice button — the very first time their
  //    finger touches the screen, the voice begins.
  const autoPlayRef = useRef(false);
  useEffect(() => {
    if (!autoPlay) return;
    if (autoPlayRef.current) return;
    if (!soundOn) return;

    autoPlayRef.current = true;

    // Try optimistically. If the browser blocks, `play()` will set
    // audioState to "locked" via its catch path on failure, OR more
    // commonly the browser silently rejects — we cover both cases
    // by also arming the gesture listener below regardless.
    void play();

    // Always arm a one-shot first-interaction listener so the second
    // a touch / scroll / key happens anywhere on the page, narration
    // starts without the user having to tap the explicit button.
    if (!voiceRequiresGesture) return;

    let fired = false;
    const trigger = () => {
      if (fired) return;
      fired = true;
      cleanup();
      void play(true);
    };
    const opts = { capture: true, passive: true } as const;
    const events: Array<keyof DocumentEventMap> = [
      "pointerdown",
      "touchstart",
      "click",
      "keydown",
      "scroll",
    ];
    events.forEach((evt) => document.addEventListener(evt, trigger, opts));
    function cleanup() {
      events.forEach((evt) =>
        document.removeEventListener(evt, trigger, opts),
      );
    }
    return cleanup;
  }, [autoPlay, play, soundOn, voiceRequiresGesture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLipSync();
      audioRef.current?.pause();
      audioContextRef.current?.close().catch(() => {});
    };
  }, [stopLipSync]);

  return {
    audioRef,
    mouthOpen,
    audioState,
    voiceRequiresGesture,
    voiceUnlocked,
    play,
    pause,
    reset,
  };
}
