"use client";

import { ArrowRight } from "@phosphor-icons/react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Clears the hero, which carries the same action, before appearing. */
const SHOW_AFTER = 560;

/**
 * Persistent primary action. The top nav scrolls away with the page, so this
 * keeps "start the assessment" reachable further down.
 */
export function FloatingCta() {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [isPastHero, setIsPastHero] = useState(false);
  const [isClosingInView, setIsClosingInView] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > SHOW_AFTER;
    setIsPastHero((current) => (current === next ? current : next));
  });

  // Step aside for the page's own closing CTA rather than guessing a distance
  // from the bottom: otherwise the rise blurs over it and two identical
  // buttons sit on screen together.
  // The footer counts too: on tall mobile footers the closing CTA scrolls away.
  useEffect(() => {
    const targets = [
      ...document.querySelectorAll('#start, [data-testid="footer"]'),
    ];
    if (targets.length === 0) {
      setIsClosingInView(false);
      return;
    }

    const inView = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          entry.isIntersecting
            ? inView.add(entry.target)
            : inView.delete(entry.target),
        );
        setIsClosingInView(inView.size > 0);
      },
      { threshold: 0 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [pathname]);

  const isVisible = isPastHero && !isClosingInView;

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6 sm:pb-8"
        >
          {/* A very wide ellipse, clipped so only its crown shows: the page
              appears to rise into the action. Translucent plus blur so it
              reads over both the night and day halves of the page. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 overflow-hidden sm:h-32"
            aria-hidden="true"
          >
            <div
              className="absolute left-1/2 top-0 h-[640px] w-[240vw] -translate-x-1/2 rounded-[50%] backdrop-blur-xl"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.14), rgba(255,255,255,0.05))",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.32), 0 -22px 50px -24px rgba(8,5,26,0.35)",
              }}
            />
          </div>

          <Link
            href="/start"
            data-testid="floating-cta-start"
            className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full bg-gold-gradient px-7 py-3.5 text-[0.9375rem] font-semibold text-[#14101F] shadow-[0_16px_40px_-12px_rgba(8,5,26,0.7)] transition-transform hover:scale-[1.03] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]"
          >
            Start assessment
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
