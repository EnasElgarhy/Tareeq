"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  firstPreloadableAssessmentAudioSource,
  resolveAssessmentNarrationSources,
  type AssessmentAudioSource,
  type ResolveAssessmentNarrationSourcesOptions,
} from "@/lib/audio/assessment-audio-sources";
import { computeKaiMouthLevel } from "@/lib/audio/lip-sync";

type PlayNarrationOptions = ResolveAssessmentNarrationSourcesOptions & {
  ownerId: string;
  playbackRate?: number;
};

type PreloadNarrationOptions = ResolveAssessmentNarrationSourcesOptions;

type InternalNarrationRequest = {
  audioId: string;
  locale: string;
  ownerId: string;
  playbackRate: number;
  sources: AssessmentAudioSource[];
};

type AssessmentAudioState = {
  isPlaying: boolean;
  isPreparing: boolean;
  isMuted: boolean;
  mouthOpen: number;
  activeOwnerId: string | null;
  currentAudioId: string | null;
  error: string | null;
};

type AssessmentAudioContextValue = AssessmentAudioState & {
  audioRef: RefObject<HTMLAudioElement | null>;
  playNarration(options: PlayNarrationOptions): void;
  preloadNarration(options: PreloadNarrationOptions): void;
  stopNarration(ownerId: string): void;
  replayNarration(ownerId: string): void;
  setMuted(muted: boolean): void;
  setPlaybackRate(rate: number): void;
};

type PreloadedAudioEntry = {
  objectUrl: string | null;
  promise: Promise<string | null>;
};

const AssessmentAudioContext =
  createContext<AssessmentAudioContextValue | null>(null);

const INITIAL_STATE: AssessmentAudioState = {
  isPlaying: false,
  isPreparing: false,
  isMuted: false,
  mouthOpen: 0,
  activeOwnerId: null,
  currentAudioId: null,
  error: null,
};

const PRELOAD_CACHE_LIMIT = 4;

function readInitialMuted() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("tareeq:sound") === "off";
}

function isAutoplayBlocked(error: unknown) {
  return (
    (error instanceof DOMException && error.name === "NotAllowedError") ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "NotAllowedError")
  );
}

export function AssessmentAudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lipSyncFrameRef = useRef<number | null>(null);
  const lipSyncLevelRef = useRef(0);
  const playbackTokenRef = useRef(0);
  const currentRequestRef = useRef<InternalNarrationRequest | null>(null);
  const pendingUnlockRequestRef = useRef<InternalNarrationRequest | null>(null);
  const voiceRequiresGestureRef = useRef(false);
  const voiceUnlockedRef = useRef(false);
  const playbackRateRef = useRef(1);
  const preloadCacheRef = useRef(new Map<string, PreloadedAudioEntry>());
  const stateRef = useRef<AssessmentAudioState>({
    ...INITIAL_STATE,
    isMuted: readInitialMuted(),
  });
  const [state, setState] = useState<AssessmentAudioState>(stateRef.current);

  const updateState = useCallback((patch: Partial<AssessmentAudioState>) => {
    const next = { ...stateRef.current, ...patch };
    stateRef.current = next;
    setState(next);
  }, []);

  const stopLipSync = useCallback((updateMouthState = true) => {
    if (lipSyncFrameRef.current != null) {
      window.cancelAnimationFrame(lipSyncFrameRef.current);
      lipSyncFrameRef.current = null;
    }
    lipSyncLevelRef.current = 0;
    if (updateMouthState) {
      updateState({ mouthOpen: 0 });
    }
  }, [updateState]);

  const ensureLipSyncGraph = useCallback((audio: HTMLAudioElement) => {
    if (!audioContextRef.current) {
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

  const startLipSync = useCallback(
    (token: number) => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      if (lipSyncFrameRef.current != null) {
        window.cancelAnimationFrame(lipSyncFrameRef.current);
      }

      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (playbackTokenRef.current !== token) return;
        analyser.getByteTimeDomainData(data);
        const nextLevel = computeKaiMouthLevel(
          data,
          lipSyncLevelRef.current,
          performance.now(),
        );
        lipSyncLevelRef.current = nextLevel;
        if (Math.abs(stateRef.current.mouthOpen - nextLevel) > 0.012) {
          updateState({ mouthOpen: nextLevel });
        }
        lipSyncFrameRef.current = window.requestAnimationFrame(tick);
      };
      tick();
    },
    [updateState],
  );

  const pauseCurrentAudio = useCallback(() => {
    audioRef.current?.pause();
    stopLipSync();
    updateState({ isPlaying: false, isPreparing: false, mouthOpen: 0 });
  }, [stopLipSync, updateState]);

  const resolvePreloadedSource = useCallback(
    async (source: AssessmentAudioSource, token: number) => {
      if (source.kind !== "static") return source.src;
      const cache = preloadCacheRef.current;
      const entry = cache.get(source.src);
      if (!entry) return source.src;

      // Touch the entry so the clip currently about to play is not the next
      // one evicted by the bounded one-question-ahead cache.
      cache.delete(source.src);
      cache.set(source.src, entry);
      const objectUrl = await entry.promise;
      if (playbackTokenRef.current !== token) {
        throw new Error("stale-playback");
      }
      return objectUrl ?? source.src;
    },
    [],
  );

  const playSource = useCallback(
    async (
      request: InternalNarrationRequest,
      source: AssessmentAudioSource,
      token: number,
    ) => {
      const audio = audioRef.current;
      if (!audio) throw new Error("Audio element unavailable.");
      if (playbackTokenRef.current !== token) throw new Error("stale-playback");
      const playableSrc = await resolvePreloadedSource(source, token);

      audio.pause();
      if (audio.getAttribute("src") !== playableSrc || audio.readyState === 0) {
        audio.src = playableSrc;
        audio.load();
      }
      audio.currentTime = 0;
      audio.playbackRate = request.playbackRate;

      const context = ensureLipSyncGraph(audio);

      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
          audio.removeEventListener("error", onError);
        };
        const settle = (fn: () => void) => {
          if (settled) return;
          settled = true;
          cleanup();
          fn();
        };
        const onError = () => {
          settle(() => reject(new Error(`Unable to load ${source.src}`)));
        };

        audio.addEventListener("error", onError, { once: true });
        const playPromise = audio.play();
        if (context?.state === "suspended") {
          void context.resume().catch(() => {});
        }
        playPromise.then(
          () => settle(resolve),
          (error: unknown) => settle(() => reject(error)),
        );
      });

      if (playbackTokenRef.current !== token) throw new Error("stale-playback");
      updateState({
        isPlaying: true,
        isPreparing: false,
        activeOwnerId: request.ownerId,
        currentAudioId: request.audioId,
        error: null,
      });
      startLipSync(token);
    },
    [ensureLipSyncGraph, resolvePreloadedSource, startLipSync, updateState],
  );

  const beginPlayback = useCallback(
    async (request: InternalNarrationRequest) => {
      if (stateRef.current.isMuted) {
        pendingUnlockRequestRef.current = null;
        updateState({
          activeOwnerId: request.ownerId,
          currentAudioId: request.audioId,
          isPlaying: false,
          isPreparing: false,
          error: null,
        });
        return;
      }

      if (voiceRequiresGestureRef.current && !voiceUnlockedRef.current) {
        pendingUnlockRequestRef.current = request;
        updateState({
          activeOwnerId: request.ownerId,
          currentAudioId: request.audioId,
          isPlaying: false,
          isPreparing: false,
          error: null,
        });
        return;
      }

      const token = playbackTokenRef.current + 1;
      playbackTokenRef.current = token;
      pendingUnlockRequestRef.current = null;
      pauseCurrentAudio();
      updateState({
        activeOwnerId: request.ownerId,
        currentAudioId: request.audioId,
        isPreparing: true,
        isPlaying: false,
        error: null,
      });

      let lastError: unknown = null;
      for (const source of request.sources) {
        if (playbackTokenRef.current !== token) return;
        try {
          await playSource(request, source, token);
          return;
        } catch (error) {
          if (playbackTokenRef.current !== token) return;
          if (isAutoplayBlocked(error)) {
            pendingUnlockRequestRef.current = request;
            updateState({ isPreparing: false, isPlaying: false });
            return;
          }
          lastError = error;
        }
      }

      if (playbackTokenRef.current !== token) return;
      stopLipSync();
      updateState({
        isPreparing: false,
        isPlaying: false,
        error:
          lastError instanceof Error
            ? lastError.message
            : "Narration unavailable.",
      });
    },
    [pauseCurrentAudio, playSource, stopLipSync, updateState],
  );

  const makeRequest = useCallback(
    ({
      audioId,
      locale = "en",
      ownerId,
      fallbackSources,
      playbackRate,
    }: PlayNarrationOptions): InternalNarrationRequest => {
      const rate = playbackRate ?? playbackRateRef.current;
      playbackRateRef.current = rate;
      return {
        audioId,
        locale,
        ownerId,
        playbackRate: rate,
        sources: resolveAssessmentNarrationSources({
          audioId,
          locale,
          fallbackSources,
        }),
      };
    },
    [],
  );

  const playNarration = useCallback(
    (options: PlayNarrationOptions) => {
      const request = makeRequest(options);
      const current = stateRef.current;
      const previousRequest = currentRequestRef.current;
      currentRequestRef.current = request;

      const hasSameSources =
        previousRequest?.sources.length === request.sources.length &&
        previousRequest.sources.every(
          (source, index) => source.src === request.sources[index]?.src,
        );

      if (
        current.activeOwnerId === request.ownerId &&
        current.currentAudioId === request.audioId &&
        previousRequest?.locale === request.locale &&
        hasSameSources &&
        (current.isPlaying || current.isPreparing)
      ) {
        if (audioRef.current) {
          audioRef.current.playbackRate = request.playbackRate;
        }
        return;
      }

      void beginPlayback(request);
    },
    [beginPlayback, makeRequest],
  );

  const preloadNarration = useCallback(
    ({ audioId, locale = "en", fallbackSources }: PreloadNarrationOptions) => {
      if (typeof window === "undefined") return;
      const sources = resolveAssessmentNarrationSources({
        audioId,
        locale,
        fallbackSources,
      });
      const source = firstPreloadableAssessmentAudioSource(sources);
      if (!source || preloadCacheRef.current.has(source.src)) return;

      const cache = preloadCacheRef.current;
      const entry: PreloadedAudioEntry = {
        objectUrl: null,
        promise: Promise.resolve(null),
      };
      entry.promise = window
        .fetch(source.src, { cache: "force-cache" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Unable to preload ${source.src}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          if (cache.get(source.src) !== entry) {
            URL.revokeObjectURL(objectUrl);
            return null;
          }
          entry.objectUrl = objectUrl;
          return objectUrl;
        })
        .catch(() => {
          if (cache.get(source.src) === entry) {
            cache.delete(source.src);
          }
          return null;
        });
      cache.set(source.src, entry);

      while (cache.size > PRELOAD_CACHE_LIMIT) {
        const oldest = cache.keys().next().value as string | undefined;
        if (!oldest) break;
        const evicted = cache.get(oldest);
        cache.delete(oldest);
        if (evicted?.objectUrl) URL.revokeObjectURL(evicted.objectUrl);
      }
    },
    [],
  );

  const stopNarration = useCallback(
    (ownerId: string) => {
      if (stateRef.current.activeOwnerId !== ownerId) return;
      playbackTokenRef.current += 1;
      pendingUnlockRequestRef.current = null;
      audioRef.current?.pause();
      if (audioRef.current) {
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      stopLipSync();
      updateState({
        isPlaying: false,
        isPreparing: false,
        activeOwnerId: null,
        currentAudioId: null,
        error: null,
        mouthOpen: 0,
      });
    },
    [stopLipSync, updateState],
  );

  const replayNarration = useCallback(
    (ownerId: string) => {
      const request = currentRequestRef.current;
      if (!request || request.ownerId !== ownerId) return;
      voiceUnlockedRef.current = true;
      void beginPlayback({
        ...request,
        playbackRate: playbackRateRef.current,
      });
    },
    [beginPlayback],
  );

  const setMuted = useCallback(
    (muted: boolean) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("tareeq:sound", muted ? "off" : "on");
      }
      updateState({ isMuted: muted });
      if (muted) {
        playbackTokenRef.current += 1;
        audioRef.current?.pause();
        stopLipSync();
        updateState({ isPlaying: false, isPreparing: false, mouthOpen: 0 });
        return;
      }

      const request = currentRequestRef.current;
      if (request) {
        voiceUnlockedRef.current = true;
        void beginPlayback({
          ...request,
          playbackRate: playbackRateRef.current,
        });
      }
    },
    [beginPlayback, stopLipSync, updateState],
  );

  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = rate;
    if (audioRef.current) audioRef.current.playbackRate = rate;
    if (currentRequestRef.current) {
      currentRequestRef.current = {
        ...currentRequestRef.current,
        playbackRate: rate,
      };
    }
  }, []);

  useEffect(() => {
    const muted = readInitialMuted();
    updateState({ isMuted: muted });
    const touchFirstDevice =
      (typeof window.matchMedia === "function" &&
        window.matchMedia("(hover: none), (pointer: coarse)").matches) ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
    voiceRequiresGestureRef.current = touchFirstDevice;
    voiceUnlockedRef.current = !touchFirstDevice;
  }, [updateState]);

  useEffect(() => {
    if (!voiceRequiresGestureRef.current || voiceUnlockedRef.current) return;
    const opts = { capture: true, passive: true } as const;
    const events: Array<keyof DocumentEventMap> = [
      "pointerdown",
      "touchstart",
      "click",
      "keydown",
      "scroll",
    ];
    const trigger = () => {
      if (voiceUnlockedRef.current) return;
      voiceUnlockedRef.current = true;
      cleanup();
      const request = pendingUnlockRequestRef.current;
      if (request && !stateRef.current.isMuted) {
        void beginPlayback(request);
      }
    };
    const cleanup = () => {
      events.forEach((event) => document.removeEventListener(event, trigger, opts));
    };
    events.forEach((event) => document.addEventListener(event, trigger, opts));
    return cleanup;
  }, [beginPlayback]);

  useEffect(() => {
    const audio = audioRef.current;
    const preloadCache = preloadCacheRef.current;

    return () => {
      playbackTokenRef.current += 1;
      audio?.pause();
      stopLipSync(false);
      void audioContextRef.current?.close();
      for (const entry of preloadCache.values()) {
        if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
      }
      preloadCache.clear();
    };
  }, [stopLipSync]);

  const value = useMemo<AssessmentAudioContextValue>(
    () => ({
      ...state,
      audioRef,
      playNarration,
      preloadNarration,
      stopNarration,
      replayNarration,
      setMuted,
      setPlaybackRate,
    }),
    [
      playNarration,
      preloadNarration,
      replayNarration,
      setMuted,
      setPlaybackRate,
      state,
      stopNarration,
    ],
  );

  return (
    <AssessmentAudioContext.Provider value={value}>
      <audio
        ref={audioRef}
        preload="none"
        playsInline
        className="hidden"
        onEnded={() => {
          stopLipSync();
          updateState({ isPlaying: false, isPreparing: false, mouthOpen: 0 });
        }}
        onPause={() => {
          if (audioRef.current?.ended) return;
          stopLipSync();
          if (stateRef.current.isPlaying) {
            updateState({ isPlaying: false, mouthOpen: 0 });
          }
        }}
      />
      {children}
    </AssessmentAudioContext.Provider>
  );
}

export function useAssessmentAudio() {
  const context = useContext(AssessmentAudioContext);
  if (!context) {
    throw new Error(
      "useAssessmentAudio must be used within AssessmentAudioProvider.",
    );
  }
  return context;
}

export type { AssessmentAudioState, PlayNarrationOptions };
