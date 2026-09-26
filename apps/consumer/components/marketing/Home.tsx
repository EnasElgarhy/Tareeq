"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Container, FadeIn, GoldButton, GhostButton } from "./Shared";
import { ScrollWorldHero } from "./ScrollWorldHero";
import { KaiBubble } from "./KaiGuide";
import { Constellation } from "./Illustrations";
import { WaveDivider } from "./Storybook";
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
} from "./WayIcons";

// Not rendered on the landing page anymore — kept for reuse on the
// assessment's own intro screen.
const STATS = [
  { value: 54, label: "questions" },
  { value: 12, prefix: "~", label: "minutes" },
  { value: 8, label: "career clusters" },
  { value: 4, label: "dimensions of fit" },
];

// Not rendered on the landing page anymore — the "Career tools were built
// for someone else" red-X checklist may move to an "Our approach" or
// research page later.
const PAINS = [
  "Built for Western job markets",
  "Assume years of work experience",
  "Measure interests, and nothing else",
];

// Not rendered on the landing page anymore — the "Four dimensions. One
// honest map of you." section and these cards may be reused on a model or
// report page later.
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
    body: "Questions about things you’re already doing, with no work experience needed.",
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

const HOME_FAQS = [
  {
    q: "Is my data private?",
    a: "Yes — your responses are encrypted, and you decide who sees your results.",
  },
  {
    q: "Is this scientifically valid?",
    a: "Yes — CORE is built on four validated frameworks from career and organizational psychology: RIASEC, the Big Five, Self-Determination Theory, and Person-Environment Fit.",
  },
  {
    q: "How much does it cost?",
    a: "Free during our current testing phase. Pricing will apply once we launch publicly.",
  },
];

interface StatProps {
  value: number;
  prefix?: string;
  label: string;
  delay?: number;
}

const Stat = ({ value, prefix = "", label, delay = 0 }: StatProps) => {
  return (
    <FadeIn delay={delay}>
      <div className="text-center">
        <p className="font-heading text-4xl sm:text-5xl font-semibold text-[var(--day-ink)]">
          {prefix}
          {value}
        </p>
        <p className="mt-2 text-sm font-medium text-[var(--day-ink-3)]">
          {label}
        </p>
      </div>
    </FadeIn>
  );
};

// Not rendered on the landing page anymore — postponing testimonials until
// there are more real users. Kept here to bring back easily, and as the
// natural home for future additions (e.g. a parent/counselor quote
// alongside this one).
const VoicesSection = () => (
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
            I knew I needed fast-paced environments. I just didn’t have
            language for it. Now I’m choosing with confidence.
          </blockquote>
          <figcaption className="mt-7 flex items-center justify-center gap-3 text-sm text-[var(--day-ink-2)]">
            <span className="h-px w-8 bg-[#B07A18]" aria-hidden />
            Salma, student, 16, UAE
          </figcaption>
        </figure>
      </FadeIn>
    </Container>
  </section>
);

export const Home = () => (
  <main>
    {/* NIGHT — the crossroads */}
    <ScrollWorldHero />

    {/* DAY — clarity */}
    <div className="bg-[var(--day-bg)] text-[var(--day-ink)]">
      {/* What makes Tareeq different — one line each */}
      <WaveDivider fill="var(--day-inset)" />
      <section className="py-14 md:py-20 bg-[var(--day-inset)]">
        <Container>
          <div className="grid grid-cols-1 border-y border-[var(--day-line)] md:grid-cols-[1.15fr_1fr_1fr] md:divide-x md:divide-[var(--day-line)]">
            {DIFFERENT.map((d, i) => {
              const Icon = d.icon;
              return (
                <FadeIn
                  key={d.title}
                  delay={i * 0.1}
                  className="border-b border-[var(--day-line)] last:border-b-0 md:border-b-0"
                >
                  <motion.article
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="h-full px-1 py-8 md:px-7 md:py-10"
                  >
                    <div className="flex size-12 items-center justify-center rounded-xl border border-[#F4C660]/40 bg-[#FFF9EE]">
                      <Icon size={26} />
                    </div>
                    <h3 className="mt-5 font-heading text-xl font-semibold">
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

      <WaveDivider fill="var(--day-bg)" className="bg-[var(--day-inset)]" />

      {/* What you get */}
      <section className="py-24 md:py-28">
        <Container>
          <FadeIn className="max-w-2xl text-left">
            <h2 className="font-heading text-4xl sm:text-5xl leading-tight font-semibold">
              More than a score.
              <br />
              <span className="text-[#6D5BA8]">Yours to use.</span>
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--day-ink-2)]">
              A clear compass, a practical report, and a summary you can share
              with the people helping you choose.
            </p>
          </FadeIn>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto items-start">
            {PRODUCT_SHOTS.map((d, i) => {
              const Shot = d.shot;
              return (
                <FadeIn key={d.title} delay={i * 0.12} className={d.lift}>
                  <div className="text-center">
                    <h3 className="font-heading text-lg font-semibold">
                      {d.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--day-ink-2)] leading-relaxed">
                      {d.body}
                    </p>
                  </div>
                  <ShotFrame tilt={d.tilt} className="mt-5">
                    <Shot />
                  </ShotFrame>
                </FadeIn>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Walking with Kai — chat + living profile */}
      <KaiShowcase />
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
              <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-[1.08] font-semibold">
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
                  Start assessment
                </GoldButton>
                <GhostButton href="/model">How it works</GhostButton>
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

    {/* FAQ teaser */}
    <div className="bg-[var(--day-bg)] text-[var(--day-ink)]">
      <section className="py-24 md:py-32">
        <Container>
          <FadeIn className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-4xl leading-tight font-semibold">
              Good questions.
            </h2>
          </FadeIn>
          <div className="mt-10 grid max-w-3xl mx-auto gap-4">
            {HOME_FAQS.map((f, i) => (
              <FadeIn key={f.q} delay={i * 0.08}>
                <div className="rounded-story border border-[var(--day-line)] bg-[var(--day-card)] p-6">
                  <h3 className="font-heading text-lg font-semibold">
                    {f.q}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--day-ink-2)]">
                    {f.a}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.24} className="mt-8 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 text-[#6D5BA8] hover:text-[#B07A18] transition-colors font-medium"
            >
              See all FAQs <WayArrow size={18} />
            </Link>
          </FadeIn>
        </Container>
      </section>
    </div>
  </main>
);
