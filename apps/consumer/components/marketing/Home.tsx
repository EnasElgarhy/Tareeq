"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container, FadeIn, GoldButton, GhostButton } from "./Shared";
import { ScrollWorldHero } from "./ScrollWorldHero";
import { KaiBubble, KaiChip } from "./KaiGuide";
import { PathToDawn, Constellation } from "./Illustrations";
import { Chapter, WaveDivider } from "./Storybook";
import { PRODUCT_SHOTS, ShotFrame } from "./ProductShots";
import { KaiShowcase } from "./KaiShowcase";
import {
  WayCompass,
  WayChat,
  WayHands,
  WaySpark,
  WayGauge,
  WayHeart,
  WayLeaf,
  WayArrow,
  CAREER_CLUSTERS,
} from "./WayIcons";

const STATS = [
  { value: 54, label: "questions" },
  { value: 12, prefix: "~", label: "minutes" },
  { value: 8, label: "career clusters" },
  { value: 4, label: "dimensions of fit" },
];

const PAINS = [
  "Built for Western job markets",
  "Assume years of work experience",
  "Measure interests — and nothing else",
];

const PILLARS = [
  {
    letter: "C",
    name: "Curiosities",
    q: "What captures your attention?",
    icon: WaySpark,
    accent: "#B07A18",
  },
  {
    letter: "O",
    name: "Operations",
    q: "How do you naturally function?",
    icon: WayGauge,
    accent: "#6D5BA8",
  },
  {
    letter: "R",
    name: "Rewards",
    q: "Why do you strive for success?",
    icon: WayHeart,
    accent: "#C96F63",
  },
  {
    letter: "E",
    name: "Ecosystems",
    q: "Where do you thrive?",
    icon: WayLeaf,
    accent: "#3D8A73",
  },
];

const DIFFERENT = [
  {
    icon: WayChat,
    title: "Real situations, not abstractions",
    body: "Questions about things you’re already doing — no work experience needed.",
  },
  {
    icon: WayCompass,
    title: "Built for MENA",
    body: "Your job markets, your universities, your family context. Not adapted from the West.",
  },
  {
    icon: WayHands,
    title: "Free for everyone",
    body: "Career guidance used to be a privilege. One assessment, open to all.",
  },
];

const DayEyebrow = ({ children }: { children: ReactNode }) => (
  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] font-semibold text-[#B07A18] mb-5">
    <span aria-hidden>✦ </span>
    {children}
  </p>
);

/** Counts up when scrolled into view. */
interface StatProps {
  value: number;
  prefix?: string;
  label: string;
  delay?: number;
}

const Stat = ({ value, prefix = "", label, delay = 0 }: StatProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t0 = performance.now();
    const DURATION = 1200;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / DURATION);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <FadeIn delay={delay}>
      <div ref={ref} className="text-center">
        <p className="font-heading text-5xl sm:text-6xl font-semibold tracking-tighter text-[var(--day-ink)]">
          {prefix}
          {n}
        </p>
        <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--day-ink-3)]">
          {label}
        </p>
      </div>
    </FadeIn>
  );
};

export const Home = () => (
  <main>
    {/* NIGHT — the crossroads */}
    <ScrollWorldHero />

    {/* DAY — clarity */}
    <div className="bg-[var(--day-bg)] text-[var(--day-ink)]">
      {/* Stat band */}
      <section className="py-16 sm:py-20 border-b border-[var(--day-line)]">
        <Container>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {STATS.map((s, i) => (
              <Stat key={s.label} {...s} delay={i * 0.08} />
            ))}
          </div>
        </Container>
      </section>

      {/* The problem — one statement, three pains */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
            <FadeIn>
              <Chapter n="Three" title="The Wrong Maps" className="mb-5" />
              <h2 className="font-heading text-4xl sm:text-6xl tracking-tighter leading-[1.06] font-semibold">
                Career tools were built
                <span className="text-[#6D5BA8]"> for someone else.</span>
              </h2>
              <ul className="mt-10 space-y-3">
                {PAINS.map((p, i) => (
                  <FadeIn key={p} delay={0.1 + i * 0.08}>
                    <li className="flex items-center gap-3 text-lg text-[var(--day-ink-2)]">
                      <span className="w-6 h-6 rounded-full bg-[#C96F63]/10 border border-[#C96F63]/40 text-[#C96F63] flex items-center justify-center text-sm leading-none">
                        ✕
                      </span>
                      {p}
                    </li>
                  </FadeIn>
                ))}
              </ul>
              <p className="mt-10 font-heading text-2xl sm:text-3xl font-semibold text-[#B07A18]">
                Tareeq starts from your reality.
              </p>
            </FadeIn>
            <FadeIn delay={0.12}>
              <PathToDawn className="w-full h-auto text-[var(--day-ink-2)]" />
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* What makes Tareeq different — one line each */}
      <WaveDivider fill="var(--day-inset)" />
      <section className="py-14 md:py-20 bg-[var(--day-inset)]">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DIFFERENT.map((d, i) => {
              const Icon = d.icon;
              return (
                <FadeIn key={d.title} delay={i * 0.1}>
                  <motion.article
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="h-full bg-[var(--day-card)] border border-[var(--day-line)] rounded-story p-8 shadow-[0_10px_36px_rgba(42,33,24,0.06)] hover:shadow-[0_18px_48px_rgba(42,33,24,0.1)] transition-shadow duration-500"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#FFF9EE] border border-[#F4C660]/40 flex items-center justify-center">
                      <Icon size={26} />
                    </div>
                    <h3 className="mt-6 font-heading text-xl font-semibold">
                      {d.title}
                    </h3>
                    <p className="mt-2 text-[15px] text-[var(--day-ink-2)] leading-relaxed">
                      {d.body}
                    </p>
                  </motion.article>
                </FadeIn>
              );
            })}
          </div>
        </Container>
      </section>

      {/* CORE — letter-forward tiles */}
      <WaveDivider fill="var(--day-bg)" className="bg-[var(--day-inset)]" />
      <section id="how" className="py-20 md:py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "var(--day-glow)" }}
        />
        <Container className="relative">
          <FadeIn className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center">
              <Chapter n="Four" title="The Map of You" className="mb-5" />
            </div>
            <h2 className="font-heading text-4xl sm:text-6xl tracking-tighter leading-tight font-semibold">
              Four questions.
              <br />
              One honest <span className="text-[#6D5BA8]">map of you.</span>
            </h2>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <FadeIn key={p.name} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 250, damping: 20 }}
                    className="relative h-full overflow-hidden bg-[var(--day-card)] border border-[var(--day-line)] rounded-story px-7 pt-8 pb-24 shadow-[0_10px_36px_rgba(42,33,24,0.06)]"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-11 h-11 rounded-xl bg-[#FFF9EE] border border-[var(--day-line)] flex items-center justify-center"
                        style={{ color: p.accent }}
                      >
                        <Icon size={22} />
                      </div>
                      <span
                        className="font-heading text-lg font-semibold"
                        style={{ color: p.accent }}
                      >
                        {p.name}
                      </span>
                    </div>
                    <p className="mt-5 text-[15px] leading-relaxed text-[var(--day-ink-2)]">
                      {p.q}
                    </p>
                    <span
                      className="absolute -bottom-10 -right-3 font-heading font-extrabold text-[10rem] leading-none select-none pointer-events-none"
                      style={{ color: `${p.accent}1f` }}
                    >
                      {p.letter}
                    </span>
                  </motion.div>
                </FadeIn>
              );
            })}
          </div>

          <FadeIn delay={0.14} className="mt-12 max-w-xl mx-auto">
            <KaiChip tone="day">
              You answer. I turn it into a map — no jargon, no scores without
              meaning.
            </KaiChip>
          </FadeIn>

          <FadeIn delay={0.18} className="mt-10 text-center">
            <Link
              href="/model"
              className="inline-flex items-center gap-2 text-[#6D5BA8] hover:text-[#B07A18] transition-colors font-medium"
            >
              Explore the full model <WayArrow size={18} />
            </Link>
          </FadeIn>
        </Container>
      </section>

      {/* Clusters — living marquee */}
      <section
        className="py-12 border-y border-[var(--day-line)] overflow-hidden"
        aria-label="Eight career clusters"
      >
        <div className="marquee-track gap-3 pr-3">
          {[...CAREER_CLUSTERS, ...CAREER_CLUSTERS].map((c, i) => {
            const Icon = c.icon;
            return (
              <span
                key={`${c.label}-${i}`}
                className="shrink-0 rounded-full bg-[var(--day-card)] border border-[var(--day-line)] px-6 py-2.5 text-sm text-[var(--day-ink-2)] flex items-center gap-2.5"
              >
                <Icon size={16} className="text-[#8A6210]" />
                {c.label}
              </span>
            );
          })}
        </div>
      </section>

      {/* What you get */}
      <section className="py-24 md:py-28">
        <Container>
          <FadeIn className="max-w-2xl">
            <DayEyebrow>What you get</DayEyebrow>
            <h2 className="font-heading text-4xl sm:text-5xl tracking-tight leading-tight font-semibold">
              Three things,{" "}
              <span className="text-[#6D5BA8]">yours to keep.</span>
            </h2>
          </FadeIn>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            {PRODUCT_SHOTS.map((d, i) => {
              const Shot = d.shot;
              return (
                <FadeIn key={d.title} delay={i * 0.12} className={d.lift}>
                  <ShotFrame tilt={d.tilt}>
                    <Shot />
                  </ShotFrame>
                  <div className="mt-5 text-center">
                    <h3 className="font-heading text-lg font-semibold">
                      {d.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--day-ink-2)] leading-relaxed">
                      {d.body}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Walking with Kai — chat + living profile */}
      <KaiShowcase />

      {/* Student story — short pull quote */}
      <section className="pb-24 md:pb-32">
        <Container>
          <FadeIn>
            <figure className="relative max-w-3xl mx-auto text-center px-6">
              <span
                className="block font-heading font-extrabold text-[7rem] leading-[0.5] text-[#F4C660]/40 select-none"
                aria-hidden
              >
                “
              </span>
              <blockquote className="font-heading text-2xl sm:text-4xl font-medium leading-snug text-[var(--day-ink)]">
                I knew I needed fast-paced environments — I just didn’t have
                language for it. Now I’m choosing with confidence.
              </blockquote>
              <figcaption className="mt-6 flex items-center justify-center gap-3">
                <span className="w-10 h-10 rounded-full bg-aurora flex items-center justify-center font-heading font-bold text-sm text-[#14101F]">
                  S
                </span>
                <p className="text-sm text-[var(--day-ink-2)]">
                  Salma ·{" "}
                  <span className="text-[#6D5BA8]">Student, 16 · UAE</span>
                </p>
              </figcaption>
            </figure>
          </FadeIn>
        </Container>
      </section>
    </div>

    {/* DUSK — back to the stars for the send-off */}
    <div className="bg-dusk-band h-[22vh] sm:h-[28vh]" aria-hidden />
    <section
      id="start"
      className="relative overflow-hidden bg-[#08051A] text-[#F5EEE6] pb-24 md:pb-32"
    >
      <Container className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
          <div className="text-center lg:text-left">
            <FadeIn>
              <Constellation className="w-64 h-auto text-[#C8B6F0]/70 mx-auto lg:mx-0 mb-8" />
              <Chapter
                n="Six"
                title="Where Your Story Begins"
                tone="night"
                className="mb-4"
              />
              <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] font-semibold">
                Understand yourself.
                <br />
                Choose with <span className="text-aurora">confidence.</span>
              </h2>
              <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <GoldButton
                  href="/start"
                  data-testid="final-cta-start"
                  className="px-10"
                >
                  Start the Assessment
                </GoldButton>
                <GhostButton href="/model">How CORE works</GhostButton>
              </div>
              <p className="mt-6 text-sm text-[#F5EEE6]/40">
                Free to start. No account needed to begin.
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={0.15} className="hidden lg:block relative">
            <KaiBubble
              tone="night"
              tail="right"
              className="absolute top-2 right-[76%] w-56 z-10"
            >
              Ready when you are. The first question is the easiest one.
            </KaiBubble>
            <Image
              src="/marketing/daybreak/kai/kai-path.jpg"
              alt="Kai on a lantern-lit path at night, looking back and beckoning you toward the dawn on the horizon"
              width={725}
              height={900}
              className="w-[400px] h-auto select-none"
              style={{
                maskImage:
                  "radial-gradient(ellipse 82% 90% at 50% 48%, black 60%, transparent 98%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 82% 90% at 50% 48%, black 60%, transparent 98%)",
              }}
            />
          </FadeIn>
        </div>
      </Container>
    </section>
  </main>
);
