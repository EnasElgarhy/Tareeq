"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  ClusterIcon,
  HeartIcon,
  LensIcon,
  PathIcon,
  PulseIcon,
  VibeIcon,
} from "@/components/brand/ContractIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  defaultVoiceOnForAssessmentStart,
  uiSounds,
} from "@/lib/audio/ui-sounds";
import { getQuestionPath } from "@/lib/assessment/questions";
import type { StringKey } from "@/lib/i18n/strings";

interface ContractIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

interface ContractItem {
  Icon: ComponentType<ContractIconProps>;
  titleKey: StringKey;
  bodyKey: StringKey;
}

/**
 * Six promises. Read like a quiet vow, not a checklist.
 * Each entry pairs one of the warm-gradient ContractIcons with a
 * single intention — what this assessment is, and what it isn't.
 */
const ITEMS: ReadonlyArray<ContractItem> = [
  { Icon: VibeIcon, titleKey: "contract.item1.title", bodyKey: "contract.item1.body" },
  { Icon: LensIcon, titleKey: "contract.item2.title", bodyKey: "contract.item2.body" },
  { Icon: HeartIcon, titleKey: "contract.item3.title", bodyKey: "contract.item3.body" },
  { Icon: PulseIcon, titleKey: "contract.item4.title", bodyKey: "contract.item4.body" },
  { Icon: ClusterIcon, titleKey: "contract.item5.title", bodyKey: "contract.item5.body" },
  { Icon: PathIcon, titleKey: "contract.item6.title", bodyKey: "contract.item6.body" },
];

// Stagger choreography (ms)
const ITEM_START_DELAY = 380;
const ITEM_STEP = 180;
const ITEM_DURATION = 720;
// CTA appears the moment the last item finishes settling
const CTA_REVEAL_DELAY =
  ITEM_START_DELAY + (ITEMS.length - 1) * ITEM_STEP + ITEM_DURATION - 120;

export function ContractScreen() {
  const router = useRouter();
  const { t } = useLocale();
  const [ctaReady, setCtaReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setCtaReady(true), CTA_REVEAL_DELAY);
    return () => window.clearTimeout(t);
  }, []);

  function start() {
    if (!ctaReady) return;
    defaultVoiceOnForAssessmentStart();
    uiSounds.advance();
    router.push(getQuestionPath(0));
  }

  return (
    <section
      aria-labelledby="contract-heading"
      className="anim-screen-enter flex flex-1 flex-col gap-3 lg:justify-center lg:gap-6"
    >
      <span className="anim-eyebrow-fade-up chip chip--violet-on-dark w-fit">
        <span className="size-1.5 rounded-full bg-gold" />
        {t("contract.eyebrow")}
      </span>

      <h1 id="contract-heading" className="text-display-2 text-sand max-w-[14ch] lg:max-w-none">
        {t("contract.headline_before")}{" "}
        <span
          className="text-grad-warm"
          style={{
            fontStyle: "italic",
            fontVariationSettings: '"SOFT" 100, "opsz" 144',
          }}
        >
          {t("contract.headline_emphasis")}
        </span>
        {t("contract.headline_after")}
      </h1>

      <p className="text-body-sm text-sand/65 leading-snug max-w-[34ch]">
        {t("contract.subtitle")}
      </p>

      {/* Desktop: two columns — six single-line-ish promises read better
       *  as a 3x2 grid than one long stretched-wide column. */}
      <ol className="mt-1 flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3">
        {ITEMS.map((item, i) => {
          const Icon = item.Icon;
          return (
            <li
              key={item.titleKey}
              className="anim-contract-item glass-card relative flex items-center gap-3.5 !p-3 !pe-4 !rounded-2xl"
              style={{ animationDelay: `${ITEM_START_DELAY + i * ITEM_STEP}ms` }}
            >
              <span
                aria-hidden="true"
                className="glass-tile relative grid size-11 shrink-0 place-items-center rounded-xl"
              >
                <Icon size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span
                    aria-hidden="true"
                    className="text-[12px] tabular-nums text-sand/35 leading-none"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontVariationSettings: '"SOFT" 60, "opsz" 96',
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[15px] font-semibold text-sand leading-tight">
                    {t(item.titleKey)}
                  </h3>
                </div>
                <p className="mt-1 text-[13.5px] leading-snug text-sand/65">
                  {t(item.bodyKey)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex-1 lg:hidden" />

      <button
        type="button"
        onClick={start}
        disabled={!ctaReady}
        aria-hidden={!ctaReady}
        className="btn-v2 btn-v2--primary w-full transition-[opacity,transform] duration-500 ease-out lg:mx-auto lg:w-fit lg:px-10"
        data-size="lg"
        style={{
          opacity: ctaReady ? 1 : 0,
          transform: ctaReady ? "translateY(0)" : "translateY(12px)",
          pointerEvents: ctaReady ? "auto" : "none",
        }}
      >
        {t("contract.cta")}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  );
}
