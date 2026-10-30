"use client";

import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { KAI_SRC_SM } from "./KaiGuide";
import { STORY_COPY } from "./storyVisualsCopy";

/* ------------------------------------------------------------------ */
/* Shared primitives                                                    */
/* ------------------------------------------------------------------ */

/**
 * Each mock-up is the product itself: a phone screen on the night sky, with
 * one detail lifted out of the frame. The four CORE letters glow in their
 * own light; colours are the site's existing night-mode accents.
 */
const CORE = {
  C: "#F4C660",
  O: "#6FE0C0",
  R: "#F2A8B3",
  E: "#B9A3FA",
} as const;
type CoreLetter = keyof typeof CORE;

const CREAM = "#F5EEE6";
const INK = "#2A2118";
const INK_2 = "#675D4E";
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const FLOAT_SHADOW = "shadow-[0_24px_50px_-16px_rgba(0,0,0,0.75)]";

const KAI_RING = "ring-1 ring-[#F4C660]/60";
const KAI_IMG_CLASSES =
  "absolute w-[170%] max-w-none left-1/2 -translate-x-1/2 top-[-6%]";

function useStoryCopy() {
  return STORY_COPY[useLocale().locale];
}

/** Viewport-triggered reveal, collapsed to nothing under reduced motion. */
function useReveal() {
  const reduce = useReducedMotion();
  return (delay = 0, y = 12) =>
    reduce
      ? {}
      : {
          initial: { y, opacity: 0 },
          whileInView: { y: 0, opacity: 1 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.6, delay, ease: EASE_OUT_EXPO },
        };
}

export function KaiFace({ size = 32 }: { size?: number }) {
  return (
    <span
      className={`relative shrink-0 rounded-full overflow-hidden ${KAI_RING} bg-gradient-to-b from-[#C8B6F0]/40 to-[#F4C660]/30`}
      style={{ width: size, height: size }}
    >
      <Image
        src={KAI_SRC_SM}
        alt=""
        aria-hidden
        width={size * 2}
        height={size * 2}
        className={KAI_IMG_CLASSES}
      />
    </span>
  );
}

/** A glowing CORE letter, the recurring mark across the four screens. */
function Orb({ letter, size = 34 }: { letter: CoreLetter; size?: number }) {
  const { locale } = useLocale();
  const color = CORE[letter];
  return (
    <span
      aria-hidden="true"
      className="relative flex shrink-0 items-center justify-center rounded-full font-heading font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.48,
        color: "#14101F",
        background: `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${color} 45%, ${color}AA 100%)`,
        boxShadow: `0 0 ${size * 0.6}px ${color}66`,
      }}
    >
      {/* No Latin letters inside Arabic lines: the orb keeps its colour only. */}
      {locale === "ar" ? null : letter}
    </span>
  );
}

/**
 * Phone frame. `children` is the screen; `floating` is a detail lifted out
 * of the frame and layered over its edge.
 */
function Phone({
  children,
  floating,
  floatingClass = "",
}: {
  children: ReactNode;
  floating?: ReactNode;
  floatingClass?: string;
}) {
  const reveal = useReveal();
  return (
    <div className="relative mx-auto w-full max-w-[540px] px-2 py-6">
      <motion.div
        {...reveal(0, 18)}
        className="relative mx-auto w-[272px] rounded-[44px] bg-[#1B1433] p-[7px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(245,238,230,0.12)]"
      >
        <div
          className="relative h-[540px] overflow-hidden rounded-[37px]"
          style={{
            background:
              "radial-gradient(120% 60% at 50% 0%, #2B1A5E 0%, #140C30 55%, #0B0720 100%)",
          }}
        >
          {/* Status bar + island */}
          <div className="relative flex items-center justify-between px-6 pt-3 text-[10px] font-semibold text-[#F5EEE6]/90">
            <span>9:41</span>
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-2 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-black"
            />
            <span
              aria-hidden="true"
              className="h-[7px] w-[13px] rounded-[2px] border border-[#F5EEE6]/80"
            />
          </div>
          <div className="px-4 pt-5">{children}</div>
        </div>
      </motion.div>

      {floating ? (
        <motion.div
          {...reveal(0.35, 16)}
          className={`absolute z-10 ${floatingClass}`}
        >
          {floating}
        </motion.div>
      ) : null}
    </div>
  );
}

/** A three-stop scale inside a tile; the student's position glows. */
function Dots({ active, color }: { active: number; color: string }) {
  return (
    <span className="mt-2 flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-[5px] flex-1 rounded-full"
          style={{
            background: i === active ? color : "rgba(245,238,230,0.14)",
          }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* 1 — Your CORE at a glance                                            */
/* ------------------------------------------------------------------ */

export function CoreGlanceVisual() {
  const { glance } = useStoryCopy();
  const { curiosity, operations, ecosystem, rewards } = glance;

  const tiles: ReadonlyArray<{
    letter: CoreLetter;
    name: string;
    value: string;
    scale?: number;
  }> = [
    { letter: "C", name: curiosity.tag, value: curiosity.clusters[0].name },
    {
      letter: "O",
      name: operations.tag,
      value: operations.options[0],
      scale: 0,
    },
    { letter: "R", name: rewards.tag, value: rewards.items[0] },
    {
      letter: "E",
      name: ecosystem.tag,
      value: ecosystem.options[0],
      scale: 0,
    },
  ];

  return (
    <Phone
      floatingClass="end-0 bottom-0"
      floating={
        <div
          className={`w-[200px] rounded-[20px] bg-[#FFFDF8] p-3.5 ${FLOAT_SHADOW}`}
        >
          <p className="text-[10px] font-semibold" style={{ color: INK_2 }}>
            {curiosity.heading}
          </p>
          <div className="relative mt-2 grid gap-2.5 ps-4">
            <span
              aria-hidden="true"
              className="absolute start-[4px] top-[5px] bottom-[14px] w-px bg-[#B07A18]"
            />
            {curiosity.clusters.map((cluster) => (
              <div key={cluster.name} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -start-4 top-[2px] size-[9px] rounded-full"
                  style={{
                    background: CORE.C,
                    boxShadow: "0 0 0 3px rgba(244,198,96,0.3)",
                  }}
                />
                <p
                  className="text-[11px] font-semibold leading-tight"
                  style={{ color: INK }}
                >
                  {cluster.name}
                </p>
                <p className="text-[9px] leading-snug" style={{ color: INK_2 }}>
                  {cluster.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9.5px] font-semibold text-[#B07A18]">
            {curiosity.connect}
          </p>
        </div>
      }
    >
      <p className="text-[10px] text-[#C8B6F0]/80">{glance.owner}</p>
      <p className="mt-0.5 font-heading text-[19px] font-semibold leading-tight text-[#F5EEE6]">
        {glance.title}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {tiles.map((tile) => (
          <div
            key={tile.letter}
            className="rounded-[18px] border border-[#F5EEE6]/10 bg-[#F5EEE6]/[0.05] p-2.5"
          >
            <Orb letter={tile.letter} size={28} />
            <p
              className="mt-2 text-[9px] font-semibold"
              style={{ color: CORE[tile.letter] }}
            >
              {tile.name}
            </p>
            <p
              className="mt-0.5 line-clamp-3 text-[10.5px] font-medium leading-snug"
              style={{ color: CREAM }}
            >
              {tile.value}
            </p>
            {tile.scale !== undefined ? (
              <Dots active={tile.scale} color={CORE[tile.letter]} />
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-[16px] border border-[#F4C660]/25 bg-[#F4C660]/[0.08] px-3 py-2.5">
        <p className="text-[9px] font-semibold text-[#F4C660]">
          {rewards.heading}
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-[#F5EEE6]/80">
          {rewards.items.join(" · ")}
        </p>
      </div>
    </Phone>
  );
}

/* ------------------------------------------------------------------ */
/* 2 — What it means for you                                            */
/* ------------------------------------------------------------------ */

const SCENE_STARS = [
  [18, 22],
  [72, 14],
  [84, 40],
  [30, 48],
  [56, 30],
  [10, 60],
] as const;

/** A small night scene: one glowing question rising over the horizon. */
function WhyScene() {
  return (
    <div
      aria-hidden="true"
      className="relative -mx-4 -mt-5 h-[150px] overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(43,26,94,0) 0%, rgba(110,72,228,0.35) 70%, rgba(244,198,96,0.25) 100%)",
      }}
    >
      {SCENE_STARS.map(([x, y]) => (
        <span
          key={`${x}-${y}`}
          className="absolute size-[2px] rounded-full bg-[#F5EEE6]/80"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}
      <span
        className="absolute left-1/2 top-[50px] flex size-[76px] -translate-x-1/2 items-center justify-center rounded-full font-heading text-[40px] font-semibold text-[#14101F]"
        style={{
          background:
            "radial-gradient(circle at 38% 30%, #FFF6DA, #F4C660 55%, #D9A23D)",
          boxShadow: "0 0 60px rgba(244,198,96,0.55)",
        }}
      >
        ?
      </span>
      <span className="absolute inset-x-[-10%] bottom-[-46px] h-[80px] rounded-[50%] bg-[#140C30]" />
    </div>
  );
}

export function MeaningVisual() {
  const { meaning } = useStoryCopy();

  return (
    <Phone>
      <WhyScene />
      <p className="mt-2 text-[10px] text-[#C8B6F0]/80">{meaning.context}</p>
      <span className="mt-1.5 inline-flex rounded-full bg-[#F4C660]/15 px-2 py-0.5 text-[9px] font-semibold text-[#F4C660]">
        {meaning.tag}
      </span>
      <p className="mt-2 font-heading text-[27px] font-semibold leading-[1.02] tracking-[-0.02em] text-[#F5EEE6]">
        {meaning.heading}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-[#F5EEE6]/70">
        {meaning.body}
      </p>
      <p className="mt-3.5 text-[10px] font-semibold text-[#F5EEE6]">
        {meaning.noticeLabel}
      </p>
      <ul className="mt-1.5 grid gap-1">
        {meaning.notices.map((notice) => (
          <li
            key={notice}
            className="flex items-start gap-1.5 text-[10.5px] leading-snug text-[#F5EEE6]/80"
          >
            <Sparkle
              size={9}
              weight="fill"
              className="mt-[3px] shrink-0 text-[#F4C660]"
              aria-hidden
            />
            {notice}
          </li>
        ))}
      </ul>
    </Phone>
  );
}

/* ------------------------------------------------------------------ */
/* 3 — From insights to career options                                  */
/* ------------------------------------------------------------------ */

export function CareerOptionsVisual() {
  const { options } = useStoryCopy();
  const { locale } = useLocale();
  const matches = [
    ["O", "#3D8A73", options.workLabel, options.work],
    ["R", "#C96F63", options.motiveLabel, options.motive],
  ] as const;

  return (
    <Phone
      floatingClass="end-0 bottom-0"
      floating={
        <div
          className={`w-[220px] rounded-[20px] bg-[#FFFDF8] p-3.5 ${FLOAT_SHADOW}`}
        >
          <div className="flex items-center justify-between gap-2">
            <p
              className="font-heading text-[15px] font-semibold"
              style={{ color: INK }}
            >
              {options.career}
            </p>
            <span className="rounded-full bg-[#2A2118] px-2 py-0.5 text-[8.5px] font-semibold text-[#F4C660]">
              {options.closest}
            </span>
          </div>
          {matches.map(([letter, color, label, text]) => (
            <p
              key={letter}
              className="mt-2 flex gap-2 text-[9.5px] leading-snug"
              style={{ color: INK_2 }}
            >
              {locale === "ar" ? null : (
                <span
                  aria-hidden="true"
                  className="font-heading text-[13px] font-semibold leading-none"
                  style={{ color }}
                >
                  {letter}
                </span>
              )}
              <span>
                <strong style={{ color: INK }}>{label}</strong> {text}
              </span>
            </p>
          ))}
        </div>
      }
    >
      <p className="text-[10px] text-[#C8B6F0]/80">{options.title}</p>

      {/* Two curiosities overlapping into one field */}
      <div
        className="relative mx-auto mt-3 h-[104px] w-[184px]"
        aria-hidden="true"
      >
        <span
          className="absolute start-0 top-0 size-[104px] rounded-full mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle at 40% 40%, rgba(244,198,96,0.6), rgba(244,198,96,0.1) 72%)",
          }}
        />
        <span
          className="absolute end-0 top-0 size-[104px] rounded-full mix-blend-screen"
          style={{
            background:
              "radial-gradient(circle at 60% 40%, rgba(242,168,179,0.6), rgba(242,168,179,0.1) 72%)",
          }}
        />
        <Sparkle
          size={14}
          weight="fill"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
        />
      </div>
      <div className="mt-1.5 flex justify-between gap-2 text-[9px] font-semibold">
        <span style={{ color: CORE.C }}>{options.tags[0]}</span>
        <span className="text-end" style={{ color: CORE.R }}>
          {options.tags[1]}
        </span>
      </div>

      <p className="mt-3 text-[9.5px] text-[#F5EEE6]/60">{options.meetLabel}</p>
      <p className="mt-0.5 font-heading text-[20px] font-semibold leading-tight text-[#F5EEE6]">
        {options.field}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {options.roles.map((role) => (
          <span
            key={role}
            className="rounded-full border border-[#F5EEE6]/15 px-2 py-0.5 text-[9px] text-[#F5EEE6]/80"
          >
            {role}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[9px] leading-snug text-[#F5EEE6]/70">
        <strong className="text-[#F5EEE6]">{options.studyLabel}</strong> {options.familyStudy}
      </p>

      {/* Next steps drawn as a short road */}
      <p className="mt-4 text-[9.5px] font-semibold text-[#F5EEE6]">
        {options.nextLabel}
      </p>
      <ol className="relative mt-2 grid grid-cols-4">
        <span
          aria-hidden="true"
          className="absolute inset-x-[12%] top-[4px] border-t border-dashed border-[#F5EEE6]/30"
        />
        {options.next.map((step, i) => (
          <li key={step} className="relative flex flex-col items-center">
            <span
              aria-hidden="true"
              className="size-[9px] rounded-full"
              style={
                i === 0
                  ? {
                      background: CORE.C,
                      boxShadow: "0 0 10px rgba(244,198,96,0.7)",
                    }
                  : {
                      background: "#140C30",
                      border: "1.5px solid rgba(245,238,230,0.4)",
                    }
              }
            />
            <span className="mt-1 text-[9px] text-[#F5EEE6]/80">{step}</span>
          </li>
        ))}
      </ol>
    </Phone>
  );
}

/* ------------------------------------------------------------------ */
/* 4 — Go deeper with Kai                                               */
/* ------------------------------------------------------------------ */

export function KaiCoachVisual() {
  const { kai } = useStoryCopy();
  const reveal = useReveal();

  return (
    <Phone
      floatingClass="start-0 top-[170px]"
      floating={
        <div
          className={`w-[204px] rounded-[18px] bg-[#FFFDF8] px-3.5 py-3 ${FLOAT_SHADOW}`}
          style={{ transform: "rotate(-3deg)" }}
        >
          <p className="text-[9.5px]" style={{ color: INK_2 }}>
            {kai.reportLabel}
          </p>
          <p
            className="mt-0.5 text-[12px] font-semibold"
            style={{ color: INK }}
          >
            {kai.section}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 py-1 text-[9.5px] font-semibold text-[#14101F]">
            {kai.discuss}
            <ArrowRight
              size={9}
              weight="bold"
              className="rtl:-scale-x-100"
              aria-hidden
            />
          </span>
        </div>
      }
    >
      <div className="flex items-center gap-2 border-b border-[#F5EEE6]/10 pb-3">
        <KaiFace size={30} />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#F5EEE6]">
            {kai.name}
          </p>
          <p className="truncate text-[9px] text-[#C8B6F0]/80">
            {kai.section}
          </p>
        </div>
      </div>

      {/* Same pattern as the real chat: Kai's turn is open text under an
          avatar + name; only the student's message sits in a bubble. */}
      <div className="flex h-[400px] flex-col justify-end gap-4 pb-14">
        <motion.article {...reveal(0.3, 8)} className="grid gap-1.5">
          <header className="flex items-center gap-1.5">
            <KaiFace size={18} />
            <span className="text-[9.5px] font-semibold text-[#C8B6F0]">
              {kai.name}
            </span>
          </header>
          <p className="pe-4 text-[12px] leading-[1.55] text-[#F5EEE6]">
            {kai.question}
          </p>
        </motion.article>
        <motion.p
          {...reveal(0.65, 8)}
          className="ms-auto max-w-[80%] rounded-[16px] rounded-ee-[5px] bg-[#F5EEE6] px-3 py-2 text-[11.5px] leading-[1.5] text-[#2A2118] shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
        >
          {kai.reply}
        </motion.p>
        <p className="text-center text-[9px] leading-snug text-[#C8B6F0]/60">
          {kai.footer}
        </p>
      </div>

      {/* Composer */}
      <div
        aria-hidden="true"
        className="absolute inset-x-3 bottom-3 flex items-center rounded-full border border-[#F5EEE6]/10 bg-[#F5EEE6]/[0.06] py-1.5 pe-1.5 ps-3.5"
      >
        <span className="flex-1" />
        <span className="flex size-6 items-center justify-center rounded-full bg-gold-gradient">
          <ArrowRight
            size={11}
            weight="bold"
            className="-rotate-90 text-[#14101F]"
          />
        </span>
      </div>
    </Phone>
  );
}
