"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { TareeqArrowLeft } from "@/components/brand/icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { BrandMark } from "@/components/primitives/BrandMark";
import { BRAND } from "@/lib/brand";

export type FlowHeaderTone = "night" | "sand";

interface FlowHeaderProps {
  /** Night for the assessment flow; sand for the light Kai chat. */
  tone?: FlowHeaderTone;
  /** Back action. Omit to hide the button (its slot keeps its width). */
  onBack?: () => void;
  /** Right-hand slot (left in Arabic), e.g. the profile chip. */
  end?: ReactNode;
}

/**
 * The one header for every screen in the assessment flow: back on the
 * start side, the brand centred at a fixed size, an optional chip on the
 * end side. Its width never depends on the screen's content width, so
 * nothing in it moves as the student goes from screen to screen.
 */
export function FlowHeader({ tone = "night", onBack, end }: FlowHeaderProps) {
  const { t } = useLocale();
  const isNight = tone === "night";

  return (
    <header className="relative z-20 mx-auto w-full max-w-[480px] px-5 pt-[env(safe-area-inset-top)] md:max-w-[560px] lg:max-w-[1040px]">
      <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex justify-start">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={t("chrome.back")}
              className={
                isNight
                  ? "assessment-icon-button size-10 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95]"
                  : "inline-flex size-10 items-center justify-center rounded-full border border-carbon/10 bg-carbon/[0.04] text-carbon transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-carbon/[0.08] active:scale-[0.95]"
              }
            >
              <TareeqArrowLeft size={15} className="flip-rtl" />
            </button>
          ) : null}
        </div>

        <Link
          href="/"
          aria-label={`${BRAND.name} home`}
          className="inline-flex items-center gap-2 rounded-full px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9D7FF0]"
        >
          <BrandMark tone={isNight ? "aurora" : "flat"} height={22} />
          <span
            dir="ltr"
            lang="en"
            className={`font-heading text-[17px] font-bold leading-none tracking-[-0.025em] ${
              isNight ? "text-sand" : "text-carbon"
            }`}
          >
            {BRAND.name}
          </span>
        </Link>

        <div className="flex justify-end">{end}</div>
      </div>
    </header>
  );
}
