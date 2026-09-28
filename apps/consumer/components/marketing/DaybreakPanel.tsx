"use client";

import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, type ReactNode } from "react";

/**
 * The day half of the page. Its top edge starts square where it meets the
 * fold and opens into a shallow oval dome as it rises over the hero, so the
 * seam reads as the page swelling upward rather than as a static rounded box.
 */
export function DaybreakPanel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    // From the panel's top entering the viewport to it reaching the top.
    offset: ["start end", "start start"],
  });

  // Wheel and trackpad scroll arrives in discrete jumps, so the raw progress
  // makes the curve step. A spring lets the edge trail the scroll and settle.
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    mass: 0.5,
    restDelta: 0.0005,
  });

  // Starts square where the panel meets the fold and opens into the oval as it
  // rises. Eased rather than linear so most of the opening happens early and
  // the last stretch settles gently.
  const spread = useTransform(progress, [0, 0.45, 1], [0, 32, 50]);
  const depth = useTransform(progress, [0, 0.45, 1], [0, 96, 150]);
  const borderRadius = useMotionTemplate`${spread}% ${spread}% 0 0 / ${depth}px ${depth}px 0 0`;

  return (
    <motion.div
      ref={ref}
      style={
        reduce
          ? { borderRadius: "50% 50% 0 0 / 110px 110px 0 0" }
          : { borderRadius }
      }
      className="relative z-10 -mt-12 bg-[var(--day-bg)] text-[var(--day-ink)] sm:-mt-16"
    >
      {children}
    </motion.div>
  );
}
