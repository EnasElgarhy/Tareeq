"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface FadeInProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
  y?: number;
}

export function FadeIn({ children, delay = 0, y = 40, className = "", ...rest }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={`text-sm uppercase tracking-[0.2em] font-semibold mb-4 block ${
        dark ? "text-[#C8B6F0]" : "text-[#6E48E4]"
      }`}
    >
      {children}
    </span>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`max-w-7xl mx-auto px-6 lg:px-8 ${className}`}>{children}</div>;
}

/** The real Tareeq brand mark — same mask-image technique used in
 *  AssessmentChrome/SharedResultScreen, so the landing page's logo matches
 *  the actual product instead of the generic placeholder dot it shipped
 *  with. */
export function TareeqMark({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 bg-aurora"
      style={{
        width: size,
        height: size,
        WebkitMaskImage: "url('/logo/tareeq-mark.svg')",
        maskImage: "url('/logo/tareeq-mark.svg')",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
