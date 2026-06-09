"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
} from "react";

export type KaiMood =
  | "curious"
  | "warm"
  | "thinking"
  | "encouraging"
  | "listening";

interface KaiProps extends HTMLAttributes<HTMLDivElement> {
  mood?: KaiMood;
  size?: number | string;
  /** Which Kai motion clip to render. Intro keeps the original wave. */
  videoVariant?: "intro" | "assessment";
  /** For assessment clips, play only while narration is active. */
  videoPlaying?: boolean;
  /** Disable idle video motion and show the poster frame. Defaults to false. */
  still?: boolean;
  /** Use "wave" only for greeting moments, such as the intro. */
  gesture?: "none" | "wave";
  /** Audio-driven speaking level, from 0 to 1. */
  mouthOpen?: number;
}

/**
 * Kai - Tareeq's mentor character.
 *
 * The assessment already drives Kai's voice, state, and lip-sync signal.
 * This component keeps that same API, but renders the supplied animated
 * character video so Kai feels like a living guide inside the assessment.
 */
export function Kai({
  mood = "warm",
  size = 112,
  videoVariant = "intro",
  videoPlaying,
  still = false,
  gesture = "none",
  mouthOpen = 0,
  className,
  style,
  ...rest
}: KaiProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const speaking = clamp01(mouthOpen);
  const isAssessmentVideo = videoVariant === "assessment";
  const shouldPlayVideo = isAssessmentVideo ? Boolean(videoPlaying) : !still;
  const visualSize = typeof size === "number" ? `${size}px` : size;
  const videoSrc =
    videoVariant === "assessment"
      ? "/kai/kai-assessment-talking.mp4"
      : "/kai/kai-reference.mp4";
  const kaiStyle = {
    "--kai-size": visualSize,
    "--kai-mouth-open": speaking,
    ...style,
  } as CSSProperties;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isAssessmentVideo) return;

    if (shouldPlayVideo) {
      video.currentTime = 0;
      void video.play().catch(() => {});
      return;
    }

    video.pause();
    if (video.readyState > 0) {
      video.currentTime = 0;
    }
  }, [isAssessmentVideo, shouldPlayVideo, videoSrc]);

  return (
    <div
      {...rest}
      aria-hidden="true"
      className={["kai-video-avatar", className].filter(Boolean).join(" ")}
      data-gesture={gesture}
      data-mood={mood}
      data-video-variant={videoVariant}
      data-speaking={speaking > 0.035 ? "true" : "false"}
      style={kaiStyle}
    >
      <span className="kai-video-avatar__halo" aria-hidden="true" />
      <span className="kai-video-avatar__rim" aria-hidden="true" />

      <video
        ref={videoRef}
        className="kai-video-avatar__media"
        src={still ? undefined : videoSrc}
        poster={isAssessmentVideo ? undefined : "/kai/kai-poster.png"}
        autoPlay={shouldPlayVideo}
        loop={shouldPlayVideo}
        muted
        onLoadedMetadata={(event) => {
          if (isAssessmentVideo && !shouldPlayVideo) {
            event.currentTarget.currentTime = 0;
          }
        }}
        playsInline
        preload={isAssessmentVideo ? "auto" : "metadata"}
      />

      <span className="kai-video-avatar__speech" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
