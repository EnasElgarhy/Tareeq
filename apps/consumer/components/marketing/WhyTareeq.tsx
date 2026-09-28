"use client";

import type { Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Container, FadeIn } from "./Shared";
import { AUDIENCES, HEADLINES, POINTS, TAB_LABELS, type Audience } from "./whyTareeqContent";

const PILL_GRADIENT = "linear-gradient(96deg, #F4C660 0%, #F2A8B3 55%, #C8B6F0 100%)";

/**
 * "Why Tareeq" on the night crossroads surface. One question, two readers:
 * the tab swaps the whole argument (headline and five points) between the
 * learner and the parent, so each sees only what they came for.
 */
export const WhyTareeq = () => {
  const { t, dir } = useLocale();
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Audience>("learners");
  const tabRefs = useRef<Record<Audience, HTMLButtonElement | null>>({
    learners: null,
    parents: null,
  });
  const baseId = useId();
  const tabId = (a: Audience) => `${baseId}-tab-${a}`;
  const panelId = `${baseId}-panel`;

  const select = (next: Audience) => {
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  // Roving focus per the WAI-ARIA tabs pattern; arrows follow reading direction.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = AUDIENCES.indexOf(active);
    const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    const moves: Record<string, number> = {
      [forward]: (index + 1) % AUDIENCES.length,
      [back]: (index - 1 + AUDIENCES.length) % AUDIENCES.length,
      Home: 0,
      End: AUDIENCES.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(AUDIENCES[moves[event.key]]);
  };

  const swap = reduce
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
      };

  return (
    <section
      className="relative overflow-hidden text-[#F5EEE6]"
      style={{ minHeight: "clamp(36rem, 48vw + 18rem, 50rem)" }}
      aria-labelledby="why-heading"
      data-testid="why-tareeq"
    >
      <Image
        src="/marketing/hero/crossroads.png"
        alt=""
        fill
        aria-hidden="true"
        className="pointer-events-none select-none object-cover"
        style={{ objectPosition: "50% 45%" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,5,26,0.66) 0%, rgba(8,5,26,0.46) 34%, rgba(8,5,26,0.6) 72%, #08051A 100%)",
        }}
      />

      <Container className="relative z-[2] py-24 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          {/* The question, the switch, and the answer's headline. */}
          <FadeIn className="lg:ps-16 lg:pt-6">
            <h2
              id="why-heading"
              className="font-heading text-4xl font-semibold leading-[1.06] sm:text-5xl"
            >
              {t("marketing.why.heading")}
            </h2>

            <div
              role="tablist"
              aria-label={t("marketing.why.tabs_label")}
              onKeyDown={onKeyDown}
              className="mt-8 inline-flex rounded-full border border-white/10 bg-[#08051A]/55 p-1 backdrop-blur-md"
            >
              {AUDIENCES.map((audience) => {
                const selected = audience === active;
                return (
                  <button
                    key={audience}
                    ref={(el) => {
                      tabRefs.current[audience] = el;
                    }}
                    id={tabId(audience)}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={panelId}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActive(audience)}
                    className={`relative rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C660] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08051A] sm:px-6 ${
                      selected ? "text-[#08051A]" : "text-[#C8B6F0] hover:text-[#F5EEE6]"
                    }`}
                  >
                    {selected && (
                      <motion.span
                        layoutId={`${baseId}-pill`}
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full shadow-[0_6px_22px_-8px_rgba(244,198,96,0.7)]"
                        style={{ background: PILL_GRADIENT }}
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{t(TAB_LABELS[audience])}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={active}
                {...swap}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 max-w-[18ch] font-heading text-[2rem] font-semibold leading-[1.15] text-[#F4C660] sm:text-[2.5rem]"
              >
                {t(HEADLINES[active])}
              </motion.p>
            </AnimatePresence>
          </FadeIn>

          {/* The five points for whoever is reading. */}
          <FadeIn delay={0.1}>
            <div
              role="tabpanel"
              id={panelId}
              aria-labelledby={tabId(active)}
              className="glass-rim glass-rim--warm relative rounded-[22px] px-6 py-3 sm:px-8 sm:py-4"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.ul
                  key={active}
                  {...swap}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-[1] divide-y divide-white/[0.08]"
                >
                  {POINTS[active].map((point) => (
                    <li key={point.title} className="flex items-start gap-4 py-5">
                      <PointMark icon={point.icon} />
                      <span>
                        <span className="block font-heading text-[17px] font-semibold leading-snug">
                          {t(point.title)}
                        </span>
                        <span className="mt-1 block max-w-[52ch] text-[14.5px] leading-relaxed text-[#C8B6F0]">
                          {t(point.body)}
                        </span>
                      </span>
                    </li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
};

/** Icon tile, or Kai herself for the point that is about her. */
const PointMark = ({ icon: IconMark }: { icon: Icon | null }) => {
  if (!IconMark) {
    return (
      <Image
        src="/kai/kai-avatar-glow.png"
        alt=""
        width={40}
        height={40}
        aria-hidden="true"
        className="size-10 shrink-0 rounded-full ring-1 ring-[#F4C660]/40"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#F4C660]/25 bg-[#F4C660]/[0.08] text-[#F4C660]"
    >
      <IconMark size={18} weight="duotone" />
    </span>
  );
};
