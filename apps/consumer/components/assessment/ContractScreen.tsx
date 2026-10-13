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
import { useAssessmentAudio } from "@/components/assessment/AssessmentAudioProvider";
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
  {
    Icon: VibeIcon,
    titleKey: "contract.item1.title",
    bodyKey: "contract.item1.body",
  },
  {
    Icon: LensIcon,
    titleKey: "contract.item2.title",
    bodyKey: "contract.item2.body",
  },
  {
    Icon: HeartIcon,
    titleKey: "contract.item3.title",
    bodyKey: "contract.item3.body",
  },
  {
    Icon: PulseIcon,
    titleKey: "contract.item4.title",
    bodyKey: "contract.item4.body",
  },
  {
    Icon: ClusterIcon,
    titleKey: "contract.item5.title",
    bodyKey: "contract.item5.body",
  },
  {
    Icon: PathIcon,
    titleKey: "contract.item6.title",
    bodyKey: "contract.item6.body",
  },
];

// Stagger choreography (ms)
const ITEM_START_DELAY = 380;
const ITEM_STEP = 180;
const ITEM_DURATION = 720;
// CTA appears the moment the last item finishes settling
const CTA_REVEAL_DELAY =
  ITEM_START_DELAY + (ITEMS.length - 1) * ITEM_STEP + ITEM_DURATION - 120;

export function ContractScreen({
  firstQuestionAudioId,
  versionId,
}: {
  firstQuestionAudioId: string | null;
  versionId: string | null;
}) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const { preloadNarration } = useAssessmentAudio();
  const [ctaReady, setCtaReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setCtaReady(true), CTA_REVEAL_DELAY);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!firstQuestionAudioId) return;
    preloadNarration({
      audioId: firstQuestionAudioId,
      locale,
      versionId,
    });
  }, [firstQuestionAudioId, locale, preloadNarration, versionId]);

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
      <h1
        id="contract-heading"
        className="text-display-2 text-sand max-w-[14ch] lg:max-w-none"
      >
        {t("contract.headline_before")}{" "}
        <span className="text-grad-warm">
          {t("contract.headline_emphasis")}
        </span>
        {t("contract.headline_after")}
      </h1>

      <p className="text-body-sm text-sand/65 leading-snug max-w-[34ch]">
        {t("contract.subtitle")}
      </p>

      {/* Mobile: one glass panel with hairline-divided rows, so six
       *  promises read as a single list rather than six competing cards.
       *  Desktop (lg): the 3x2 grid of individual cards. */}
      <ol className="contract-list mt-1">
        {ITEMS.map((item, i) => {
          const Icon = item.Icon;
          return (
            <li
              key={item.titleKey}
              className="contract-item anim-contract-item"
              style={{
                animationDelay: `${ITEM_START_DELAY + i * ITEM_STEP}ms`,
              }}
            >
              <span aria-hidden="true" className="contract-item__icon">
                <Icon size={26} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold leading-tight text-sand">
                  {t(item.titleKey)}
                </h3>
                <p className="mt-1 text-[13px] leading-snug text-sand/60">
                  {t(item.bodyKey)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex-1 lg:hidden" />

      <div className="contract-cta">
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
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
