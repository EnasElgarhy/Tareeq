"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, type KeyboardEvent } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { AUDIENCES, TAB_LABELS, type Audience } from "../whyTareeqContent";

interface AudienceTabsProps {
  active: Audience;
  onChange: (a: Audience) => void;
  tabId: (a: Audience) => string;
  panelId: string;
}

/** WAI-ARIA tabs with roving focus; arrows follow reading direction. */
export const AudienceTabs = ({
  active,
  onChange,
  tabId,
  panelId,
}: AudienceTabsProps) => {
  const { t, dir } = useLocale();
  const reduce = useReducedMotion();
  const refs = useRef<Record<Audience, HTMLButtonElement | null>>({
    learners: null,
    parents: null,
  });

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
    const next = AUDIENCES[moves[event.key]];
    onChange(next);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={t("marketing.why.tabs_label")}
      onKeyDown={onKeyDown}
      className="inline-flex self-start rounded-full border border-[var(--day-line)] bg-[var(--day-inset)] p-1.5 md:self-auto"
    >
      {AUDIENCES.map((audience) => {
        const selected = audience === active;
        return (
          <button
            key={audience}
            ref={(el) => {
              refs.current[audience] = el;
            }}
            id={tabId(audience)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(audience)}
            className={`relative rounded-full px-5 py-3 text-[15px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B07A18] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--day-inset)] active:scale-[0.98] sm:px-7 ${
              selected
                ? "text-[#FFF9EE]"
                : "text-[var(--day-ink-2)] hover:text-[var(--day-ink)]"
            }`}
          >
            {selected && (
              <motion.span
                layoutId={`${panelId}-pill`}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-[#1B1433] shadow-[0_8px_20px_-10px_rgba(27,20,51,0.8)]"
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 34 }
                }
              />
            )}
            <span className="relative">{t(TAB_LABELS[audience])}</span>
          </button>
        );
      })}
    </div>
  );
};
