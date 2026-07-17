"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";
import { Container, FadeIn } from "./Shared";
import { Chapter } from "./Storybook";
import { KAI_SRC_SM } from "./KaiGuide";
import { WayCatalyst } from "./WayIcons";

const PLAN_ITEMS: ReadonlyArray<[string, string, boolean]> = [
  ["Watch", "a day in the life of a product manager", true],
  ["Try", "redesign your school’s app — mini project", true],
  ["Meet", "Amal, PM in Dubai — intro drafted", false],
];

/**
 * "Walking with Kai" — the product beyond the result: chatting with Kai
 * and the living profile she keeps for you. Same code-built mockup
 * technique as ProductShots.
 */

const KaiAvatar = ({ size = "w-8 h-8" }: { size?: string }) => (
  <span
    className={`relative shrink-0 ${size} rounded-full overflow-hidden ring-1 ring-[#F4C660]/60 bg-gradient-to-b from-[#C8B6F0]/40 to-[#F4C660]/30`}
  >
    <Image
      src={KAI_SRC_SM}
      alt=""
      aria-hidden
      width={64}
      height={64}
      className="absolute w-[170%] max-w-none left-1/2 -translate-x-1/2 top-[-6%]"
    />
  </span>
);

/** Layla — flat vector avatar, drawn in the site’s illustration language. */
export const LaylaAvatar = ({
  size = 48,
  className = "",
}: {
  size?: number | string;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    role="img"
    aria-label="Layla’s avatar"
    className={className}
  >
    <defs>
      <linearGradient id="layla-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#C8B6F0" />
        <stop offset="60%" stopColor="#E5C9E2" />
        <stop offset="100%" stopColor="#F4C660" />
      </linearGradient>
      <clipPath id="layla-clip">
        <circle cx="24" cy="24" r="24" />
      </clipPath>
    </defs>
    <g clipPath="url(#layla-clip)">
      <circle cx="24" cy="24" r="24" fill="url(#layla-bg)" />
      {/* hair behind */}
      <path
        d="M24 6.5c-8.6 0-13.4 6.2-13.4 13.6 0 5 1.2 8.2 1.2 12.2 0 3.4-.9 5.9-.9 5.9h26.2s-.9-2.5-.9-5.9c0-4 1.2-7.2 1.2-12.2C37.4 12.7 32.6 6.5 24 6.5Z"
        fill="#3E2A20"
      />
      {/* shoulders / tee */}
      <path
        d="M7.5 48c1.6-8.4 8.2-12.4 16.5-12.4S38.9 39.6 40.5 48H7.5Z"
        fill="#6D5BA8"
      />
      {/* neck */}
      <path
        d="M20.8 29h6.4v7.2c0 1.9-1.4 3.1-3.2 3.1s-3.2-1.2-3.2-3.1V29Z"
        fill="#D99B6F"
      />
      {/* face */}
      <ellipse cx="24" cy="21.5" rx="8.7" ry="9.6" fill="#E8B084" />
      {/* bangs */}
      <path
        d="M15.3 20.5c-.4-7 3.2-11.6 8.7-11.6s9.1 4.6 8.7 11.6c0 0-1.6-4.3-4.4-5.6-1.7 1.9-6.5 2.9-9.6 1.7-1.9.9-3.4 3.9-3.4 3.9Z"
        fill="#4A3226"
      />
      {/* earrings */}
      <circle cx="15.4" cy="23.4" r="1.2" fill="#F4C660" />
      <circle cx="32.6" cy="23.4" r="1.2" fill="#F4C660" />
      {/* brows */}
      <path
        d="M19 18.6c1-.9 2.6-1 3.6-.4M29 18.6c-1-.9-2.6-1-3.6-.4"
        stroke="#3E2A20"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
      {/* eyes */}
      <circle cx="20.7" cy="21.6" r="1.25" fill="#2A1B12" />
      <circle cx="27.3" cy="21.6" r="1.25" fill="#2A1B12" />
      {/* blush */}
      <circle cx="18.3" cy="24.6" r="1.6" fill="#E98A7A" opacity="0.45" />
      <circle cx="29.7" cy="24.6" r="1.6" fill="#E98A7A" opacity="0.45" />
      {/* smile */}
      <path
        d="M21.6 26.2c1.5 1.5 3.3 1.5 4.8 0"
        stroke="#8A4B33"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  </svg>
);
/** A waypoint dot sitting on the path at each moment. */
const Waypoint = () => (
  <span
    className="absolute left-6 sm:left-1/2 top-8 -translate-x-1/2 z-10 w-4 h-4 rounded-full bg-[#F4C660] ring-4 ring-[var(--day-bg)] shadow-[0_0_0_1px_rgba(176,122,24,0.35)]"
    aria-hidden
  />
);

/**
 * One moment on the walk. side: "left" | "right" — which side of the
 * path the content sits on (desktop); on mobile everything sits right
 * of the left-edge path.
 */
const Moment = ({
  side,
  delay = 0,
  children,
}: {
  side: "left" | "right";
  delay?: number;
  children: ReactNode;
}) => (
  <div className="relative">
    <Waypoint />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
      <FadeIn
        delay={delay}
        className={`pl-14 sm:pl-0 ${
          side === "left"
            ? "sm:pr-12 sm:col-start-1 sm:justify-self-end"
            : "sm:pl-12 sm:col-start-2 sm:justify-self-start"
        }`}
      >
        {children}
      </FadeIn>
    </div>
  </div>
);

export const KaiShowcase = () => (
  <section
    className="py-24 md:py-32 relative overflow-hidden"
    aria-labelledby="kai-showcase-heading"
  >
    <Container>
      <FadeIn className="max-w-2xl mx-auto text-center mb-16 sm:mb-20">
        <div className="flex justify-center">
          <Chapter n="Five" title="Walking With Kai" className="mb-5" />
        </div>
        <h2
          id="kai-showcase-heading"
          className="font-heading text-4xl sm:text-5xl tracking-tight leading-tight font-semibold"
        >
          You never read the map <span className="text-[#6D5BA8]">alone.</span>
        </h2>
        <p className="mt-5 text-lg text-[var(--day-ink-2)] leading-relaxed">
          A real walk with Kai — from result to plan.
        </p>
      </FadeIn>

      <div className="relative max-w-3xl mx-auto">
        {/* the path itself, drawing in as you walk it */}
        <svg
          className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 -translate-x-1/2 top-0 h-full w-20 sm:w-28"
          viewBox="0 0 100 800"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden
        >
          <path
            d="M50 0 C 15 110, 85 190, 50 300 C 18 400, 82 480, 50 590 C 25 670, 70 740, 50 800"
            stroke="#D9A93F"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="0.5 11"
            opacity="0.8"
          />
        </svg>

        <div className="relative space-y-10 sm:space-y-14 pb-4">
          {/* 1 — Kai opens */}
          <Moment side="left">
            <div className="flex items-start gap-3 max-w-sm">
              <KaiAvatar />
              <div className="rounded-story bg-[var(--day-card)] border border-[var(--day-line)] shadow-[0_10px_30px_rgba(42,33,24,0.08)] px-5 py-4">
                <p className="font-hand text-xl leading-snug text-[var(--day-ink)]">
                  Your Catalyst result — want to see what it means for choosing
                  a major?
                </p>
              </div>
            </div>
          </Moment>

          {/* 2 — Layla answers */}
          <Moment side="right" delay={0.05}>
            <div className="flex items-start gap-3 max-w-sm flex-row-reverse">
              <LaylaAvatar
                size={36}
                className="shrink-0 rounded-full ring-1 ring-[#F4C660]/50"
              />
              <div className="rounded-story-alt bg-[#221248] px-5 py-4 shadow-[0_10px_30px_rgba(34,18,72,0.25)]">
                <p className="text-[15px] leading-relaxed text-[#F5EEE6]">
                  Yes! I’m torn between computer science and business.
                </p>
              </div>
            </div>
          </Moment>

          {/* 3 — Kai pins a plan to the path */}
          <Moment side="left" delay={0.05}>
            <div className="max-w-sm">
              <div className="flex items-start gap-3 mb-4">
                <KaiAvatar />
                <div className="rounded-story bg-[var(--day-card)] border border-[var(--day-line)] shadow-[0_10px_30px_rgba(42,33,24,0.08)] px-5 py-4">
                  <p className="font-hand text-xl leading-snug text-[var(--day-ink)]">
                    You don’t have to pick — product roles blend both. Here’s
                    your plan:
                  </p>
                </div>
              </div>
              <div className="relative ml-11 -rotate-2 hover:rotate-0 transition-transform duration-300 rounded-xl bg-white border border-[var(--day-line)] shadow-[0_16px_40px_rgba(42,33,24,0.12)] overflow-hidden">
                <span
                  aria-hidden
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[#B07A18] text-lg leading-none"
                >
                  ✦
                </span>
                <p className="px-4 pt-4 pb-2 text-[10px] uppercase tracking-[0.16em] font-bold text-[#B07A18] border-b border-[var(--day-line)]">
                  Layla’s 2-week plan
                </p>
                <ul className="px-4 py-3 space-y-2">
                  {PLAN_ITEMS.map(([verb, rest, done]) => (
                    <li
                      key={verb}
                      className="flex items-start gap-2.5 text-[13px] leading-snug"
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 shrink-0 rounded-full border flex items-center justify-center text-[9px] ${
                          done
                            ? "bg-[#3D8A73] border-[#3D8A73] text-white"
                            : "border-[var(--day-ink-3)]/50 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="text-[var(--day-ink-2)]">
                        <strong className="text-[var(--day-ink)]">
                          {verb}:
                        </strong>{" "}
                        {rest}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  {["Compare CS vs Business", "Show me product roles"].map(
                    (chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-[#6D5BA8]/40 bg-[#6D5BA8]/[0.07] px-3 py-1.5 text-xs font-medium text-[#6D5BA8]"
                      >
                        {chip}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </Moment>

          {/* 4 — the log of the journey so far */}
          <Moment side="right" delay={0.05}>
            <div className="max-w-sm rotate-1 rounded-story-alt bg-[var(--day-elevated)] border border-[var(--day-line)] shadow-[0_16px_40px_rgba(42,33,24,0.1)] p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[var(--day-ink-3)]">
                Three months later · her living profile
              </p>
              <div className="mt-3 flex items-center gap-3">
                <LaylaAvatar
                  size={44}
                  className="shrink-0 rounded-full ring-2 ring-[#F4C660]/50"
                />
                <div>
                  <p className="font-heading font-semibold text-[var(--day-ink)] leading-tight">
                    Layla, 17
                  </p>
                  <p className="inline-flex items-center gap-1.5 mt-1 rounded-full bg-[#221248] px-2.5 py-1 text-[11px] font-semibold text-[#F4C660]">
                    <WayCatalyst size={13} /> The Catalyst
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-[var(--day-ink-2)] mb-1">
                  <span className="font-medium">Arts / Media</span>
                  <span>
                    <span className="text-[#3D8A73] font-semibold">+11</span> ·
                    84
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--day-inset)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "84%" }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    className="h-full rounded-full bg-[#6D5BA8]"
                  />
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-[#FFF9EE] border border-[#F4C660]/40 px-4 py-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--day-ink)]">
                  Product Design
                </p>
                <span className="rounded-full bg-[#F4C660]/40 px-2.5 py-1 text-[11px] font-bold text-[#7A4A21]">
                  91% fit
                </span>
              </div>
              <p className="mt-3 font-hand text-lg text-[#B07A18] -rotate-1">
                told you the 2am feeling was data. — Kai
              </p>
            </div>
          </Moment>
        </div>
      </div>
    </Container>
  </section>
);
