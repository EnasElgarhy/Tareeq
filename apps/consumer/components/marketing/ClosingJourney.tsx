"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Container } from "./Shared";
import styles from "./ClosingJourney.module.css";

/** A short, unpinned scroll into the next chapter; the CTA is always available. */
export function ClosingJourney() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { t } = useLocale();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-40, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1]);
  const curve = useTransform(
    scrollYProgress,
    [0, 0.8, 1],
    [
      "50% 50% 0 0 / 160px 160px 0 0",
      "50% 50% 0 0 / 24px 24px 0 0",
      "50% 50% 0 0 / 24px 24px 0 0",
    ],
  );
  const light = useTransform(scrollYProgress, [0, 0.45, 1], [0.1, 0.4, 0.85]);
  const darkness = useTransform(scrollYProgress, [0, 0.85, 1], [0.65, 0, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.65, 1], [30, 0, 0]);

  return (
    <section
      ref={ref}
      id="start"
      aria-labelledby="closing-journey-heading"
      className={styles.section}
    >
      <motion.div
        className={styles.scene}
        style={{ borderRadius: reduce ? "24px 24px 0 0" : curve }}
        aria-hidden="true"
      >
        <motion.div
          className={styles.landscape}
          style={reduce ? undefined : { y, scale }}
        >
          <Image
            src="/marketing/hero/kai-path-sunset.png"
            alt=""
            fill
            sizes="100vw"
            className={styles.image}
          />
        </motion.div>
        <motion.div
          className={styles.sunlight}
          style={{ opacity: reduce ? 0.6 : light }}
        />
        <motion.div
          className={styles.doorShadow}
          style={{ opacity: reduce ? 0 : darkness }}
        />
        <div className={styles.shade} />
      </motion.div>

      <Container className={styles.content}>
        <motion.div
          className={styles.copy}
          style={reduce ? undefined : { y: copyY }}
        >
          <h2
            id="closing-journey-heading"
            className={`font-heading ${styles.heading}`}
          >
            {t("marketing.results.close_heading")}
          </h2>
          <p className={styles.nextStep}>{t("marketing.results.close_body")}</p>
          <Link
            href="/start"
            data-testid="results-story-cta"
            className="mt-9 inline-flex items-center justify-center rounded-full bg-gold-gradient px-9 py-4 text-base font-semibold text-[#14101F] transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4C660] motion-reduce:transform-none"
          >
            {t("marketing.hero.cta")}
          </Link>
          <p className="mt-4 text-sm text-[#F5EEE6]/70">
            {t("marketing.hero.time")}
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
