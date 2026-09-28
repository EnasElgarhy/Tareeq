"use client";

import {
  ArrowsLeftRight,
  BookOpen,
  FlagBanner,
  Sparkle,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { KAI_SRC_SM } from "./KaiGuide";
import { STORY_COPY } from "./storyVisualsCopy";
import { WayCatalyst, WayHeart, WayLeaf } from "./WayIcons";

/* ------------------------------------------------------------------ */
/* Shared primitives                                                    */
/* ------------------------------------------------------------------ */

const KAI_RING = "ring-1 ring-[#F4C660]/60";

function useStoryCopy() {
  return STORY_COPY[useLocale().locale];
}
const KAI_IMG_CLASSES =
  "absolute w-[170%] max-w-none left-1/2 -translate-x-1/2 top-[-6%]";

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

function Bar({
  label,
  value,
  color,
  delay = 0,
}: {
  label: string;
  value: number;
  color: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const copy = useStoryCopy();
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[11px] text-[var(--day-ink-2)] mb-1">
        <span className="font-medium">{label}</span>
        <span>{copy.fit(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--day-inset)] overflow-hidden">
        <motion.div
          initial={reduce ? false : { width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.1, delay, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1 — Career Compass                                                   */
/* ------------------------------------------------------------------ */

export function CareerCompassVisual() {
  const { compass } = useStoryCopy();
  const pills: ReadonlyArray<[string, string, ReactNode, string]> = [
    [
      compass.drivesLabel,
      compass.drives,
      <WayHeart key="h" size={13} />,
      "#C96F63",
    ],
    [
      compass.thrivesLabel,
      compass.thrives,
      <WayLeaf key="l" size={13} />,
      "#3D8A73",
    ],
  ];
  return (
    <div className="w-full max-w-[420px] rounded-[26px] border border-[var(--day-line)] bg-[#FDFAF3] p-6 shadow-[0_20px_56px_rgba(42,33,24,0.1)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--day-ink-3)] font-semibold">
          {compass.title}
        </p>
        <KaiFace size={28} />
      </div>

      {/* Archetype badge */}
      <div className="rounded-2xl bg-gradient-to-br from-[#221248] to-[#08051A] px-4 py-4 mb-5 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center text-[#14101F]">
          <WayCatalyst size={22} />
        </span>
        <div>
          <p className="text-[9px] uppercase tracking-[0.15em] text-[#C8B6F0]">
            {compass.archetypeLabel}
          </p>
          <p className="font-heading font-semibold text-[#F5EEE6] text-lg">
            {compass.archetype}
          </p>
        </div>
      </div>

      {/* Cluster bars */}
      <p className="text-[11px] font-semibold text-[var(--day-ink-2)] mb-2.5">
        {compass.topClusters}
      </p>
      <Bar label={compass.clusters[0]} value={92} color="#B07A18" />
      <Bar
        label={compass.clusters[1]}
        value={84}
        color="#6D5BA8"
        delay={0.15}
      />
      <Bar label={compass.clusters[2]} value={71} color="#3D8A73" delay={0.3} />

      {/* Detail pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        {pills.map(([k, v, icon, color]) => (
          <span
            key={k}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]"
            style={{
              background: `${color}14`,
              color,
            }}
          >
            <span className="flex items-center">{icon}</span>
            <span className="opacity-70">{k}:</span> <strong>{v}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 — Narrative Report                                                 */
/* ------------------------------------------------------------------ */

export function NarrativeReportVisual() {
  const { report } = useStoryCopy();
  return (
    <div className="relative w-full max-w-[460px] pb-3 pe-3">
      {/* Stacked pages */}
      <div
        aria-hidden="true"
        className="absolute inset-x-3 bottom-1 top-3 rounded-[22px] border border-[#F5EEE6]/40 bg-[#E9E0D4]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-3 start-5 end-1 rounded-[22px] border border-[#F5EEE6]/50 bg-[#F4EDE3]"
      />

      {/* Main page */}
      <article
        className="relative overflow-hidden rounded-[22px] bg-[#FFFDF7] shadow-[0_24px_64px_rgba(8,5,26,0.2)]"
        style={{ border: "1px solid rgba(245,238,230,0.55)" }}
      >
        {/* Dark signal band */}
        <div
          className="grid grid-cols-[1.35fr_0.8fr_1fr] px-6 py-4"
          style={{
            background:
              "radial-gradient(circle at 82% 10%, rgba(110,72,228,0.24), transparent 40%), linear-gradient(135deg, #100A24, #1A1140)",
          }}
        >
          <div className="pe-4">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#C8B6F0]/75">
              {report.signal}
            </p>
            <p className="mt-1 text-[13px] font-semibold leading-tight text-[#F5EEE6]">
              {report.signalValue}
            </p>
          </div>
          <div className="border-s border-[#F5EEE6]/10 px-4">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#C8B6F0]/75">
              {report.confidence}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-[13px] font-semibold leading-tight text-[#B9A3FA]">
                38%
              </p>
              <span
                aria-hidden="true"
                className="h-1 flex-1 overflow-hidden rounded-full bg-[#F5EEE6]/10"
              >
                <span className="block h-full w-[38%] rounded-full bg-[#9D7FF0]" />
              </span>
            </div>
          </div>
          <div className="border-s border-[#F5EEE6]/10 ps-4">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#C8B6F0]/75">
              {report.style}
            </p>
            <p className="mt-1 text-[13px] font-semibold leading-tight text-[#6FE0C0]">
              {report.styleValue}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-[#2A2118]/10 pb-3">
            <div className="flex items-center gap-2">
              <Image
                src="/logo/tareeq-mark.svg"
                alt=""
                width={14}
                height={14}
                aria-hidden="true"
                className="size-3.5"
              />
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8A6620]">
                {report.title}
              </p>
            </div>
            <p className="text-[9px] font-semibold tabular-nums text-[#2A2118]/45">
              02 / 06
            </p>
          </div>

          <p className="max-w-[390px] font-heading text-[25px] font-semibold leading-[1.08] tracking-[-0.025em] text-[#2A2118]">
            {report.heading}
          </p>

          <div
            className="relative mt-5 overflow-hidden rounded-[16px] px-5 py-4"
            style={{
              background:
                "radial-gradient(circle at 100% 0%, rgba(157,127,240,0.18), transparent 46%), linear-gradient(135deg, rgba(34,18,72,0.96), rgba(16,10,36,0.98))",
              border: "1px solid rgba(157,127,240,0.18)",
            }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-4 start-0 w-[3px] rounded-e-full bg-[#F4C660]"
            />
            <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.13em] text-[#F4C660]">
              {report.patternLabel}
            </p>
            <p className="max-w-[350px] text-[15px] font-semibold leading-[1.38] text-[#F5EEE6]">
              {report.pattern}
            </p>
            <p className="mt-2.5 max-w-[350px] text-[11px] leading-[1.55] text-[#F5EEE6]/[0.62]">
              {report.patternBody}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 — Careers + Study Paths (card collage)                              */
/* ------------------------------------------------------------------ */

/** Visual data only; the words come from STORY_COPY by index. */
const CAREER_CARDS = [
  { fit: 91, accent: "#B07A18", top: true },
  { fit: 87, accent: "#6D5BA8", top: false },
  { fit: 84, accent: "#3D8A73", top: false },
] as const;

const SUBJECTS = [
  { glyph: "ψ", accent: "#C96F63" },
  { glyph: "⚗", accent: "#3D8A73" },
  { glyph: "☱", accent: "#6D5BA8" },
] as const;

export function OptionsVisual() {
  const reduce = useReducedMotion();
  const { options } = useStoryCopy();
  const careers = CAREER_CARDS.map((card, i) => ({
    ...card,
    label: options.careers[i],
    cluster: options.careerClusters[i],
  }));
  const subjects = SUBJECTS.map((subject, i) => ({
    ...subject,
    label: options.subjects[i],
  }));
  const paths = options.paths.map((label, i) => ({
    label,
    desc: options.pathDescs[i],
  }));

  return (
    <div className="relative w-full max-w-[460px]">
      {/* Shared warm glow + shadow behind the whole card group */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -bottom-4 rounded-[3rem] blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 38%, rgba(244,198,96,0.16), rgba(157,127,240,0.1) 50%, transparent 78%)",
          boxShadow: "0 30px 72px rgba(8,5,26,0.16)",
        }}
      />

      {/* ── Career Matches — main card, slightly narrower ── */}
      <motion.article
        initial={reduce ? {} : { y: 12, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto w-[92%] rounded-[24px] border border-[#F5EEE6]/25 bg-[#FFFDF8] px-5 py-5 shadow-[0_18px_48px_rgba(8,5,26,0.18)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8A6620]">
            {options.title}
          </p>
          <span className="text-[9px] font-semibold text-[#675D4E]/80">
            {options.basis}
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-0.5">
          {careers.map((c) => (
            <div
              key={c.label}
              className="group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-[#FDFAF3]"
              style={{ background: c.top ? `${c.accent}0D` : "transparent" }}
            >
              {/* Fit percentage ring */}
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  background: `${c.accent}1A`,
                  color: c.accent,
                }}
              >
                {c.fit}%
              </span>

              {/* Text + integrated progress line */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#2A2118]">
                    {c.label}
                  </span>
                  {c.top ? (
                    <span
                      className="rounded-full px-1.5 py-px text-[9px] font-semibold"
                      style={{
                        background: `${c.accent}22`,
                        color: c.accent,
                      }}
                    >
                      {options.topMatch}
                    </span>
                  ) : null}
                  {/* Inline progress line */}
                  <span
                    aria-hidden
                    className="ms-auto h-1 shrink-0 rounded-full"
                    style={{
                      width: `${Math.max(c.fit * 0.5, 18)}px`,
                      background: `linear-gradient(90deg, ${c.accent}, ${c.accent}66)`,
                    }}
                  />
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-[#675D4E]/85">
                  {c.cluster}
                </p>
              </div>

              {/* Hover arrow */}
              <span
                aria-hidden
                className="inline-block shrink-0 text-[#675D4E]/40 opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100"
                style={{ fontSize: 15 }}
              >
                ›
              </span>
            </div>
          ))}
        </div>
      </motion.article>

      {/* ── Subjects + University — editorial offset pair ── */}
      <div className="relative z-0 mt-1.5 grid grid-cols-[1fr_1fr] gap-2">
        {/* Subjects — offset left, rotated slightly */}
        <motion.article
          initial={reduce ? {} : { y: 16, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-[18px] border border-[#F5EEE6]/20 bg-[#FAF7F1] px-3.5 py-3.5 shadow-[0_10px_28px_rgba(8,5,26,0.1)]"
          style={{ transform: "translateX(-4px) rotate(-1deg)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6D5BA8] mb-2.5">
            {options.subjectsLabel}
          </p>
          <div className="space-y-1">
            {subjects.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                style={{ background: `${s.accent}10` }}
              >
                {/* Small product icon — subject-specific glyph */}
                <span
                  aria-hidden
                  className="flex size-4 shrink-0 items-center justify-center rounded text-[9px]"
                  style={{
                    background: `${s.accent}22`,
                    color: s.accent,
                  }}
                >
                  {s.glyph}
                </span>
                <span className="text-[11px] font-semibold text-[#2A2118]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </motion.article>

        {/* University paths — offset right */}
        <motion.article
          initial={reduce ? {} : { y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-[18px] border border-[#F5EEE6]/20 bg-white/[0.93] px-3.5 py-3.5 shadow-[0_10px_28px_rgba(8,5,26,0.08)]"
          style={{ transform: "translateX(3px) rotate(0.7deg)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3D8A73] mb-2.5">
            {options.pathsLabel}
          </p>
          <div className="space-y-1">
            {paths.map((p) => (
              <div
                key={p.label}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#3D8A73]/[0.06]"
              >
                {/* Degree cap icon */}
                <span
                  aria-hidden
                  className="flex size-4 shrink-0 items-center justify-center rounded text-[9px]"
                  style={{
                    background: "rgba(61,138,115,0.15)",
                    color: "#3D8A73",
                  }}
                >
                  ▸
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold text-[#2A2118] leading-tight">
                    {p.label}
                  </span>
                  <span className="text-[9px] font-medium text-[#675D4E]/80">
                    {p.desc}
                  </span>
                </div>
                {/* Action arrow */}
                <span
                  aria-hidden
                  className="inline-block shrink-0 text-[#3D8A73]/40 opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100"
                  style={{ fontSize: 13 }}
                >
                  →
                </span>
              </div>
            ))}
          </div>
        </motion.article>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4 — Kai Insight                                                       */
/* ------------------------------------------------------------------ */

const NEXT_ACTIONS = [
  { icon: ArrowsLeftRight, accent: "#6D5BA8" },
  { icon: BookOpen, accent: "#B07A18" },
  { icon: FlagBanner, accent: "#3D8A73" },
] as const;

export function KaiConversationVisual() {
  const reduce = useReducedMotion();
  const { kai } = useStoryCopy();
  const actions = NEXT_ACTIONS.map((action, i) => ({
    ...action,
    label: kai.actions[i],
  }));

  return (
    <div className="relative w-full max-w-[460px]">
      {/* ── Direction chip — overlaps top edge ── */}
      <motion.div
        initial={reduce ? {} : { y: 8, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4 }}
        className="relative z-20 ms-3"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-[#F5EEE6]/25 bg-[#100A24]/80 backdrop-blur-md px-3.5 py-1.5 shadow-[0_8px_24px_rgba(8,5,26,0.35)]">
          <span className="text-[10px] font-medium text-[#C8B6F0]">
            {kai.directionLabel}
          </span>
          <span
            aria-hidden
            className="flex size-2 shrink-0 rounded-full"
            style={{ background: "linear-gradient(135deg, #F4C660, #9D7FF0)" }}
          />
          <span className="text-[10px] font-semibold text-[#F5EEE6]">
            {kai.direction}
          </span>
        </span>
      </motion.div>

      {/* ── Main card ── */}
      <motion.article
        initial={reduce ? {} : { y: 16, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="relative -mt-2 rounded-[30px] bg-[#FFFDF8] shadow-[0_24px_64px_rgba(8,5,26,0.18)]"
        style={{ border: "1px solid rgba(245,238,230,0.3)" }}
      >
        <div className="px-7 py-7">
          {/* ── Kai identity row ── */}
          <div className="flex items-center gap-3 mb-5">
            <KaiFace size={48} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-semibold text-[#2A2118]">
                  {kai.name}
                </span>
                <Sparkle size={10} weight="fill" style={{ color: "#F4C660" }} />
              </div>
              <p className="text-[11px] text-[#675D4E]">{kai.role}</p>
            </div>
          </div>

          {/* ── Student question — left-aligned ── */}
          <div className="flex justify-start mb-3">
            <div className="rounded-2xl bg-[#F5EEE6]/70 px-4 py-2.5 max-w-[78%]">
              <p className="text-[12.5px] leading-snug text-[#675D4E]">
                {kai.question}
              </p>
            </div>
          </div>

          {/* ── Kai's response — right-aligned ── */}
          <div className="flex justify-end mb-5">
            <div className="flex items-start gap-2.5 max-w-[85%]">
              <div
                className="flex-1 rounded-2xl px-4 py-3.5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(109,91,168,0.055), rgba(244,198,96,0.035))",
                  border: "1px solid rgba(109,91,168,0.1)",
                }}
              >
                <p className="font-heading text-[17px] font-semibold leading-[1.15] text-[#2A2118] mb-1.5">
                  {kai.answerHeading}
                </p>
                <p className="text-[12.5px] leading-relaxed text-[#675D4E]">
                  {kai.answerBody}
                </p>

                {/* Personalisation evidence */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#675D4E]/60">
                    {kai.basedOn}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                    style={{
                      background: "rgba(201,111,99,0.1)",
                      color: "#C96F63",
                    }}
                  >
                    {kai.evidence[0]}
                  </span>
                  <span className="text-[10px] text-[#675D4E]/60">
                    {kai.and}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                    style={{
                      background: "rgba(109,91,168,0.1)",
                      color: "#6D5BA8",
                    }}
                  >
                    {kai.evidence[1]}
                  </span>
                </div>
              </div>
              <KaiFace size={22} />
            </div>
          </div>

          {/* ── Next actions ── */}
          <div className="flex gap-2.5 justify-end">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.label}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2"
                  style={{ background: `${a.accent}0D` }}
                >
                  <Icon
                    size={13}
                    weight="regular"
                    style={{ color: a.accent }}
                  />
                  <span
                    className="text-[10.5px] font-medium"
                    style={{ color: a.accent }}
                  >
                    {a.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.article>
    </div>
  );
}
