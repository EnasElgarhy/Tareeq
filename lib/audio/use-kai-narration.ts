"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
        const ext = FALLBACK_EXTENSIONS[fallbackIdxRef.current] ?? "mp3";
        if (!audio.src || !audio.src.includes(`${audioId}.${ext}`)) {
          audio.src = `/audio/${audioId}.${ext}`;
          audio.load();
        }
        setAudioState("loading");
        const ctx = ensureLipSyncGraph(audio);
        if (ctx && ctx.state === "suspended") {
          await ctx.resume();
        }
        audio.currentTime = 0;
        await audio.play();
        setAudioState("playing");
        startLipSync();
      } catch {
        // Try the other format once
        if (fallbackIdxRef.current < FALLBACK_EXTENSIONS.length - 1) {
          fallbackIdxRef.current += 1;
          await play(userGesture);
          return;
        }
        setAudioState("unavailable");
        stopLipSync();
      }
    },
    [audioId, ensureLipSyncGraph, soundOn, startLipSync, stopLipSync, voiceRequiresGesture, voiceUnlocked],
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
  }, [stopLipSync]);

  // Auto-play on mount once we know the gesture requirement.
  // On touch devices we wait for an explicit click; on desktop we go.
  const autoPlayRef = useRef(false);
  useEffect(() => {
    if (!autoPlay) return;
    if (autoPlayRef.current) return;
    if (!soundOn) return;
    if (voiceRequiresGesture && !voiceUnlocked) {
      setAudioState("locked");
      return;
    }
    autoPlayRef.current = true;
    void play();
  }, [autoPlay, play, soundOn, voiceRequiresGesture, voiceUnlocked]);

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
