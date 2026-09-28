"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Container } from "../Shared";
import type { Audience } from "../whyTareeqContent";
import { AudienceTabs } from "./AudienceTabs";
import { PANEL_COPY } from "./content";
import { REASON_ACCENTS, REASON_ICONS } from "./ReasonIcons";

/**
 * "Why Tareeq" as a question and its answer. The left column asks it (heading
 * and reader switch); the right column answers it for whoever is reading. The switch is the only interaction.
 */
export const WhyTareeqSection = () => {
  const { t } = useLocale();
  const [audience, setAudience] = useState<Audience>("learners");
  const baseId = useId();
  const tabId = (a: Audience) => `${baseId}-tab-${a}`;
  const panelId = `${baseId}-panel`;
  const copy = PANEL_COPY[audience];

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24"
      aria-labelledby="why-heading"
      data-testid="why-tareeq"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--day-glow)" }}
      />
      <Container className="relative">
        <div className="mx-auto grid max-w-[1160px] gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* The question */}
          <div className="relative flex flex-col">
            <h2
              id="why-heading"
              className="font-heading text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--day-ink)] sm:text-6xl lg:text-[4.25rem]"
            >
              {t("marketing.why.heading")}
            </h2>
            <p className="mt-5 max-w-[30ch] text-lg leading-relaxed text-[var(--day-ink-2)]">
              {t("marketing.whyStory.lead")}
            </p>
            <div className="mt-8">
              <AudienceTabs
                active={audience}
                onChange={setAudience}
                tabId={tabId}
                panelId={panelId}
              />
            </div>
          </div>

          {/* The answer */}
          <div
            role="tabpanel"
            id={panelId}
            aria-labelledby={tabId(audience)}
            className="lg:pt-3"
          >
            <Swap id={audience}>
              <h3 className="max-w-[22ch] font-heading text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--day-ink)] sm:text-[2.4rem]">
                {t(copy.headline)}
              </h3>
              <p className="mt-4 max-w-[50ch] text-[16.5px] leading-relaxed text-[var(--day-ink-2)]">
                {t(copy.description)}
              </p>

              <ul className="mt-9 grid gap-7 border-t border-[var(--day-line)] pt-9">
                {copy.reasons.map((reason, i) => {
                  const ReasonIcon = REASON_ICONS[audience][i];
                  const accent = REASON_ACCENTS[i % REASON_ACCENTS.length];
                  return (
                    <li
                      key={reason.title}
                      className="group grid grid-cols-[3rem_1fr] items-start gap-x-5"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-12 place-items-center rounded-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5"
                        style={{
                          color: accent,
                          background: `${accent}12`,
                          boxShadow: `inset 0 0 0 1px ${accent}24`,
                        }}
                      >
                        {ReasonIcon && <ReasonIcon size={24} />}
                      </span>
                      <span className="pt-1">
                        <span className="block font-heading text-[17px] font-semibold leading-snug text-[var(--day-ink)]">
                          {t(reason.title)}
                        </span>
                        <span className="mt-1 block max-w-[46ch] text-[15px] leading-relaxed text-[var(--day-ink-2)]">
                          {t(reason.body)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Swap>
          </div>
        </div>
      </Container>
    </section>
  );
};

const SWAP_SECONDS = 0.2;

/** Crossfades its children in place when `id` changes. */
const Swap = ({ id, children }: { id: string; children: ReactNode }) => {
  const reduce = useReducedMotion();
  return (
    <div className="grid">
      <AnimatePresence initial={false}>
        <motion.div
          key={id}
          initial={{ opacity: 0, y: reduce ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : SWAP_SECONDS, ease: "easeOut" }}
          className="col-start-1 row-start-1"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
