"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import Link from "next/link";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
  href: string;
  className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto max-w-7xl px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function FadeIn({
  children,
  delay = 0,
  y = 40,
  className = "",
  ...rest
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 90, damping: 20, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="mb-5 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.28em] text-[#C8B6F0]">
      <span className="h-px w-8 bg-gradient-to-r from-[#F4C660] to-transparent" />
      {children}
    </span>
  );
}

export function Glass({
  children,
  className = "",
  ...rest
}: ContainerProps & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function GoldButton({
  children,
  href,
  className = "",
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-8 py-4 font-semibold text-[#14101F] shadow-[0_12px_40px_rgba(244,198,96,0.3)] transition-transform hover:scale-[1.03] ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function GhostButton({
  children,
  href,
  className = "",
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-8 py-4 font-medium text-[#F5EEE6] transition-all hover:border-white/30 hover:bg-white/[0.08] ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
