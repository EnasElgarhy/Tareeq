"use client";

import { Clock, Compass, ListChecks, Path } from "@phosphor-icons/react";
import { Container, FadeIn, GradientText } from "./Shared";

/**
 * The four facts about the assessment. The plates use the page's own day
 * card surface and hairline; colour is carried only by the label and the
 * number, in the same four accents the CORE pillar tiles use below.
 */
const STATS = [
  {
    value: "54",
    label: "Questions",
    body: "Short and concrete, about things you already do.",
    icon: ListChecks,
    accent: "#B07A18",
  },
  {
    value: "~12",
    label: "Minutes",
    body: "One sitting. No preparation, no revision.",
    icon: Clock,
    accent: "#6D5BA8",
  },
  {
    value: "8",
    label: "Career clusters",
    body: "Mapped to the work that actually exists in MENA.",
    icon: Compass,
    accent: "#C96F63",
  },
  {
    value: "4",
    label: "Dimensions of fit",
    body: "Curiosities, operations, rewards and ecosystems.",
    icon: Path,
    accent: "#3D8A73",
  },
];

export const StatsBand = () => (
  <section
    className="relative overflow-hidden py-20 sm:py-24"
    data-testid="daybreak-stats"
    aria-labelledby="stats-heading"
  >
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-24 h-72"
      style={{
        background:
          "radial-gradient(ellipse 42% 90% at 64% 0%, rgba(244,198,96,0.32) 0%, rgba(244,169,124,0.12) 42%, transparent 74%)",
      }}
    />

    <Container className="relative">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <h2
          id="stats-heading"
          className="font-heading text-4xl font-semibold leading-[1.08] sm:text-5xl"
        >
          Twelve minutes, and you know{" "}
          <GradientText>where to look.</GradientText>
        </h2>
      </FadeIn>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {STATS.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <FadeIn key={stat.label} delay={index * 0.08}>
              <article className="flex h-full flex-col justify-between rounded-story border border-[var(--day-line)] bg-[var(--day-card)] p-5 shadow-[0_10px_36px_rgba(42,33,24,0.06)] sm:min-h-[14rem] sm:p-6">
                <span
                  className="inline-flex w-fit items-center gap-2 rounded-full border bg-[#FFF9EE] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: stat.accent, borderColor: `${stat.accent}33` }}
                >
                  <Icon size={13} weight="bold" aria-hidden="true" />
                  {stat.label}
                </span>

                <p
                  className="mt-7 font-heading text-[3.25rem] font-semibold leading-none tracking-[-0.03em]"
                  style={{ color: stat.accent }}
                >
                  {stat.value}
                </p>

                <span
                  className="mt-4 block h-px w-full bg-[var(--day-line)]"
                  aria-hidden="true"
                />

                <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--day-ink-2)]">
                  {stat.body}
                </p>
              </article>
            </FadeIn>
          );
        })}
      </div>
    </Container>
  </section>
);
