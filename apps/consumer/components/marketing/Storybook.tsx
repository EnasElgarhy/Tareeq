"use client";

import { Sparkle } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";

interface ChapterProps {
  n: string;
  title: string;
  tone?: "night" | "day" | "dawn";
  className?: string;
}

interface WaveDividerProps {
  fill?: string;
  flip?: boolean;
  className?: string;
}

/**
 * Storybook devices: handwritten chapter markers and soft wave dividers.
 * The site reads as Kai’s storybook — each scroll act opens with a chapter.
 */

/** Handwritten chapter marker. tone: "night" | "day" | "dawn" */
export const Chapter = ({
  n,
  title,
  tone = "day",
  className = "",
}: ChapterProps) => {
  const reduce = useReducedMotion();
  const color =
    tone === "night"
      ? "text-[#F4C660]"
      : tone === "dawn"
        ? "text-[#7A4A21]"
        : "text-[#B07A18]";
  return (
    <motion.p
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 80, damping: 14 }}
      className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase leading-none tracking-[0.18em] sm:text-xs ${color} ${className}`}
    >
      <Sparkle size={13} weight="fill" aria-hidden />
      Chapter {n} · {title}
    </motion.p>
  );
};

/**
 * Soft wave divider between sections. Renders the NEXT section’s background
 * color as a wave over the current one. Pass flip to curl the other way.
 */
export const WaveDivider = ({
  fill = "var(--day-inset)",
  flip = false,
  className = "",
}: WaveDividerProps) => (
  <div className={`relative -mb-px ${className}`} aria-hidden>
    <svg
      viewBox="0 0 1440 72"
      preserveAspectRatio="none"
      className={`block w-full h-10 sm:h-16 ${flip ? "-scale-y-100" : ""}`}
    >
      <path
        d="M0 40 C 180 8 360 64 540 44 C 720 24 900 4 1080 24 C 1260 44 1360 56 1440 36 L 1440 72 L 0 72 Z"
        fill={fill}
      />
    </svg>
  </div>
);
