"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";

interface KaiFigureProps {
  className?: string;
  size?: number;
  priority?: boolean;
}

interface KaiBubbleProps {
  tone?: "night" | "day";
  tail?: "left" | "right";
  children: ReactNode;
  className?: string;
}

interface KaiChipProps {
  tone?: "night" | "day";
  children: ReactNode;
  className?: string;
}

/**
 * Kai — the assistant character. She appears as a guide across the site:
 * full figure in the hero, small "Kai says" chips inside content sections.
 * Cutout renders from the isolated marketing asset directory.
 */

export const KAI_SRC = "/marketing/daybreak/kai/kai-720.png";
export const KAI_SRC_SM = "/marketing/daybreak/kai/kai-320.png";

/** Full-figure Kai with a warm glow, for heroes and large panels. */
export const KaiFigure = ({
  className = "",
  size = 320,
  priority = false,
}: KaiFigureProps) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={reduce ? {} : { y: [0, -8, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(244,198,96,0.55), rgba(200,182,240,0.25) 55%, transparent 75%)",
        }}
      />
      <Image
        src={KAI_SRC}
        alt="Kai, Tareeq’s AI guide, a young woman with curly hair, round glasses and gold earrings"
        width={size}
        height={size}
        priority={priority}
        className="relative w-full h-full object-contain drop-shadow-[0_18px_40px_rgba(8,5,26,0.45)]"
      />
    </motion.div>
  );
};

/** Speech bubble that accompanies Kai. tone: "night" | "day" */
export const KaiBubble = ({
  tone = "night",
  tail = "left",
  children,
  className = "",
}: KaiBubbleProps) => {
  const surface =
    tone === "night"
      ? "bg-[#100A24]/80 border-white/15 text-[#F5EEE6] backdrop-blur-xl"
      : "bg-[var(--day-elevated)] border-[var(--day-line)] text-[var(--day-ink)] shadow-[0_12px_36px_rgba(42,33,24,0.12)]";
  return (
    <div
      className={`relative rounded-story border px-5 py-4 ${surface} ${className}`}
    >
      <span
        aria-hidden
        className={`absolute top-6 w-3.5 h-3.5 rotate-45 border ${
          tone === "night"
            ? "bg-[#100A24]/80 border-white/15 backdrop-blur-xl"
            : "bg-[var(--day-elevated)] border-[var(--day-line)]"
        } ${tail === "left" ? "-left-2 border-r-0 border-t-0" : "-right-2 border-l-0 border-b-0"}`}
      />
      <span className="font-hand text-xl sm:text-2xl leading-tight block">
        {children}
      </span>
    </div>
  );
};

/** Small inline guide note: Kai’s face + a line of context. tone: "night" | "day" */
export const KaiChip = ({
  tone = "day",
  children,
  className = "",
}: KaiChipProps) => {
  const surface =
    tone === "night"
      ? "bg-white/[0.05] border-white/12 text-[#F5EEE6]/85"
      : "bg-[#FFF9EE] border-[#F4C660]/45 text-[var(--day-ink-2)]";
  return (
    <div
      className={`flex items-start gap-3 rounded-story-alt border px-4 py-3 ${surface} ${className}`}
    >
      <span className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#F4C660]/70 bg-gradient-to-b from-[#C8B6F0]/40 to-[#F4C660]/30">
        <Image
          src={KAI_SRC_SM}
          alt=""
          aria-hidden
          width={64}
          height={64}
          className="absolute w-[170%] max-w-none left-1/2 -translate-x-1/2 top-[-6%]"
        />
      </span>
      <div className="font-hand text-xl leading-snug">
        <span
          className={`font-semibold ${tone === "night" ? "text-[#F4C660]" : "text-[#B07A18]"}`}
        >
          Kai:{" "}
        </span>
        {children}
      </div>
    </div>
  );
};
