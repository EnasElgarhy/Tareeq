"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type ComponentType, type ReactNode } from "react";
import { IconPlus } from "./Icons";
import { Container, FadeIn } from "./Shared";
import type { WayIconProps } from "./WayIcons";

interface IllustrationProps {
  className?: string;
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  accent?: string;
  lede?: string;
  art?: ComponentType<IllustrationProps>;
  artClass?: string;
}

interface SectionProps {
  eyebrow?: string;
  title?: string;
  accent?: string;
  children: ReactNode;
  className?: string;
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface FaqItem {
  q: string;
  a: string;
}

interface AccordionProps {
  items: ReadonlyArray<FaqItem>;
  testPrefix?: string;
  defaultOpen?: number;
}

interface AccordionItemProps extends FaqItem {
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  testPrefix: string;
}

export function DayEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#7A4A21]">
      <span aria-hidden="true">✦</span>
      {children}
    </p>
  );
}

export function DayPage({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[color:var(--day-bg)] text-[color:var(--day-ink)]">
      {children}
      <div className="h-40 bg-dusk-band sm:h-56" aria-hidden="true" />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  accent,
  lede,
  art: Art,
  artClass = "",
}: PageHeroProps) {
  return (
    <header className="relative overflow-hidden pb-12 pt-28 md:pb-14 md:pt-32">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-0 top-0 h-[26rem]"
          style={{
            background:
              "linear-gradient(180deg, rgba(109,91,168,0.28) 0%, rgba(200,182,240,0.22) 34%, rgba(244,169,124,0.18) 62%, transparent 100%)",
          }}
        />
        <div className="absolute -right-24 -top-24 size-[24rem] rounded-full bg-[#F4C660]/20 blur-3xl" />
      </div>
      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_auto]">
          <FadeIn className="max-w-3xl">
            {eyebrow ? <DayEyebrow>{eyebrow}</DayEyebrow> : null}
            <h1 className="font-heading text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              {title}{" "}
              {accent ? <span className="text-[#6D5BA8]">{accent}</span> : null}
            </h1>
            {lede ? (
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[color:var(--day-ink-2)]">
                {lede}
              </p>
            ) : null}
          </FadeIn>
          {Art ? (
            <FadeIn delay={0.12} className="hidden lg:block">
              <Art
                className={`text-[color:var(--day-ink-2)] ${artClass || "h-auto w-56"}`}
              />
            </FadeIn>
          ) : null}
        </div>
      </Container>
    </header>
  );
}

export function Section({
  eyebrow,
  title,
  accent,
  children,
  className = "",
}: SectionProps) {
  return (
    <section className={`py-16 md:py-20 ${className}`}>
      <Container>
        {eyebrow || title ? (
          <FadeIn className="mb-12 max-w-2xl">
            {eyebrow ? <DayEyebrow>{eyebrow}</DayEyebrow> : null}
            {title ? (
              <h2 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">
                {title}{" "}
                {accent ? (
                  <span className="text-[#6D5BA8]">{accent}</span>
                ) : null}
              </h2>
            ) : null}
          </FadeIn>
        ) : null}
        {children}
      </Container>
    </section>
  );
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-story border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-8 shadow-[0_10px_36px_rgba(42,33,24,0.06)] transition-shadow duration-500 hover:shadow-[0_18px_48px_rgba(42,33,24,0.1)] ${className}`}
    >
      {children}
    </div>
  );
}

export function IconChip({
  icon: Icon,
  color = "#6D5BA8",
}: {
  icon: ComponentType<WayIconProps>;
  color?: string;
}) {
  return (
    <div
      className="flex size-12 items-center justify-center rounded-xl border border-[color:var(--day-line)] bg-[#FFF9EE]"
      style={{ color }}
    >
      <Icon size={24} />
    </div>
  );
}

function AccordionItem({
  q,
  a,
  index,
  isOpen,
  onToggle,
  testPrefix,
}: AccordionItemProps) {
  return (
    <div className="border-b border-[color:var(--day-line)]">
      <button
        type="button"
        onClick={onToggle}
        data-testid={`${testPrefix}-${index + 1}`}
        aria-expanded={isOpen}
        className="group flex w-full items-center justify-between gap-4 py-6 text-left"
      >
        <span className="font-heading text-lg font-semibold transition-colors group-hover:text-[#7A4A21]">
          {q}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-[#6D5BA8]"
        >
          <IconPlus size={20} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 leading-relaxed text-[color:var(--day-ink-2)]">
              {a}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function Accordion({
  items,
  testPrefix = "faq-item",
  defaultOpen = 0,
}: AccordionProps) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);

  return (
    <div className="border-t border-[color:var(--day-line)]">
      {items.map((item, index) => (
        <AccordionItem
          key={item.q}
          {...item}
          index={index}
          testPrefix={testPrefix}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
        />
      ))}
    </div>
  );
}

export function DotList({
  items,
  className = "",
}: {
  items: ReadonlyArray<string>;
  className?: string;
}) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 leading-relaxed text-[color:var(--day-ink-2)]"
        >
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#F4C660]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
