"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Container } from "../Shared";
import { CoreDial } from "./CoreDial";
import { HERO } from "./modelContent";

const EASE = [0.16, 1, 0.3, 1] as const;

// `.bg-gold-gradient` uses the `background` shorthand, which resets clipping.
const ACCENT_TEXT = {
  backgroundImage:
    "linear-gradient(90deg, #F4C660 0%, #F5D57F 45%, #F2A8B3 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
} as const;

export function ModelHero() {
  const reduce = useReducedMotion();
  const { t } = useLocale();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <section
      aria-labelledby="model-hero-heading"
      className="relative overflow-hidden pb-36 pt-32 sm:pb-44 lg:pt-40"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 end-[-10%] size-[46rem] rounded-full bg-[radial-gradient(circle,rgba(157,127,240,0.2),transparent_62%)]"
      />
      <Container className="relative grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-10">
        <div>
          <motion.p
            {...rise(0)}
            className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F4C660]/85"
          >
            {HERO.eyebrow}
          </motion.p>
          <motion.h1
            {...rise(0.08)}
            id="model-hero-heading"
            className="font-heading mt-6 text-[clamp(2.6rem,5.4vw,4.75rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-[#F5EEE6]"
          >
            {HERO.title}
            <span className="mt-1 block text-transparent" style={ACCENT_TEXT}>
              {HERO.accent}
            </span>
          </motion.h1>
          <motion.p
            {...rise(0.16)}
            className="mt-6 max-w-md text-lg leading-relaxed text-[#F5EEE6]/70"
          >
            {HERO.lede}
          </motion.p>
          <motion.div {...rise(0.24)} className="mt-10">
            <Link
              href="/start"
              className="inline-flex items-center justify-center rounded-full bg-gold-gradient px-8 py-4 text-base font-semibold text-[#14101F] transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660] motion-reduce:transform-none"
            >
              {t("marketing.hero.cta")}
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
        >
          <CoreDial />
        </motion.div>
      </Container>
    </section>
  );
}
