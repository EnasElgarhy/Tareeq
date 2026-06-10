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

      {/* Compass frame — Kai's face sits at the center of the Career
          Compass. Tick-ring bezel + cardinal rose points radiate around
          the portrait, echoing the results-screen ResultCompass. */}
      <svg
        className="kai-video-avatar__compass"
        viewBox="0 0 240 240"
        aria-hidden="true"
      >
        <g className="kai-video-avatar__compass-rose">
          {/* Faint outer ring */}
          <circle
            cx="120"
            cy="120"
            r="117"
            fill="none"
            stroke="rgba(157,127,240,0.5)"
            strokeWidth="1.5"
          />
          {/* Ticked bezel hugging the round face */}
          <circle
            cx="120"
            cy="120"
            r="96"
            fill="none"
            stroke="rgba(245,238,230,0.4)"
            strokeWidth="9"
            strokeDasharray="2 9"
          />
          {/* Four bold cardinal ticks (N / E / S / W) */}
          <g
            stroke="rgba(245,238,230,0.82)"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <line x1="120" y1="6" x2="120" y2="42" />
            <line x1="120" y1="198" x2="120" y2="234" />
            <line x1="6" y1="120" x2="42" y2="120" />
            <line x1="198" y1="120" x2="234" y2="120" />
          </g>
        </g>
        {/* North marker — fixed gold pip so the dial reads as a compass. */}
        <circle cx="120" cy="6" r="5" fill="#f4c660" />
      </svg>

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
