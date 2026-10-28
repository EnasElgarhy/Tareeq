"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/primitives/BrandMark";

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

/** The landing page's brand mark: the same BrandMark the product uses.
 *  `size` is the old square box; the wider mark takes 80% of it in height. */
export function TareeqMark({ size = 32 }: { size?: number }) {
  return (
    <BrandMark tone="aurora" height={Math.round(size * 0.8)} />
  );
}
