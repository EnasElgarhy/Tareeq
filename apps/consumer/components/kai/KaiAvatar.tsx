"use client";

import { useEffect, useState } from "react";
import styles from "./KaiAvatar.module.css";

/** Three frames of one Gemini render, aligned so only eyes and mouth change. */
const FRAMES = {
  idle: "/kai/avatar/kai-avatar-idle.webp",
  blink: "/kai/avatar/kai-avatar-blink.webp",
  talk: "/kai/avatar/kai-avatar-talk.webp",
} as const;

type Frame = keyof typeof FRAMES;

const BLINK_MS = 140;
const BLINK_MIN_GAP_MS = 2800;
const BLINK_GAP_RANGE_MS = 2600;
const TALK_FRAME_MS = 170;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Kai as a living avatar: she breathes and blinks at rest, and her mouth
 * moves while `isTalking`. Reduced motion shows the still idle frame.
 */
export function KaiAvatar({
  size = 48,
  isTalking = false,
  isOnline = true,
}: {
  size?: number;
  isTalking?: boolean;
  isOnline?: boolean;
}) {
  const [frame, setFrame] = useState<Frame>("idle");

  // Blink at a slightly irregular rhythm, like a person does.
  useEffect(() => {
    if (isTalking || prefersReducedMotion()) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setFrame("blink");
          timer = setTimeout(() => {
            setFrame("idle");
            schedule();
          }, BLINK_MS);
        },
        BLINK_MIN_GAP_MS + Math.random() * BLINK_GAP_RANGE_MS,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [isTalking]);

  // Alternate open and closed mouth while Kai is "speaking".
  useEffect(() => {
    if (!isTalking || prefersReducedMotion()) {
      setFrame("idle");
      return;
    }
    const interval = setInterval(() => {
      setFrame((current) => (current === "talk" ? "idle" : "talk"));
    }, TALK_FRAME_MS);
    return () => {
      clearInterval(interval);
      setFrame("idle");
    };
  }, [isTalking]);

  return (
    <span
      aria-hidden="true"
      className={styles.avatar}
      style={{ width: size, height: size }}
    >
      <span className={styles.portrait}>
        {(Object.keys(FRAMES) as Frame[]).map((name) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={name}
            src={FRAMES[name]}
            alt=""
            width={256}
            height={256}
            data-visible={frame === name}
          />
        ))}
      </span>
      {isOnline ? <span className={styles.online} /> : null}
    </span>
  );
}
