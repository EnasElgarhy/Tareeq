"use client";

import { ArrowRight, Check } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { StringKey } from "@/lib/i18n/strings";
import type { ReportOffer } from "@/lib/payments/report-access";
import {
  fill,
  formatOfferListPrice,
  formatOfferPrice,
  hasOfferDiscount,
} from "./story-data";

const CHECKS: StringKey[] = [
  "paywall.v2.check1",
  "paywall.v2.check2",
  "paywall.v2.check3",
  "paywall.v2.check4",
  "paywall.v2.check5",
];

/** How far the frost runs above the offer card, in px (≈ three locked rows). */
const FROST_HEIGHT = 208;

/**
 * The Figma frame's closing beat: a sheet that slides over the locked rail
 * and veils it into the paper, carrying the white offer card — checklist,
 * price, one action.
 *
 * The frost is split across two layers. `ExploreTimeline` really blurs the
 * locked tail of the rail (`filter: blur`), because a `backdrop-filter` here
 * cannot sample content inside the app shell's scroll well. This sheet then
 * lays a cream veil on top, ramped by a mask so the veil's top edge is
 * seamless and the report is heavily veiled by the card's edge — the
 * unopened chapters read as one frosted continuation instead of a hard cut.
 */
export function PaywallSheet({
  offer,
  onOpen,
}: {
  offer: ReportOffer;
  onOpen(): void;
}) {
  const { locale, t } = useLocale();
  const price = formatOfferPrice(offer, locale);
  const listPrice = formatOfferListPrice(offer, locale);

  return (
    <div className="relative z-10 -mt-[488px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(244,238,227,0) 0px, rgba(244,238,227,0.34) 80px, rgba(244,238,227,0.42) ${FROST_HEIGHT}px)`,
          maskImage: `linear-gradient(to bottom, transparent 0px, #000 80px, #000 100%)`,
          WebkitMaskImage: `linear-gradient(to bottom, transparent 0px, #000 80px, #000 100%)`,
        }}
      />

      <div className="relative pb-14" style={{ paddingTop: FROST_HEIGHT }}>
        <section
          aria-labelledby="offer-heading"
          className="rounded-[32px] border border-[rgba(43,36,28,0.1)] bg-[color:var(--day-card)] px-6 pb-6 pt-7 text-center shadow-[0_20px_48px_rgba(42,33,24,0.08)]"
        >
          <p
            className="text-[10px] font-bold uppercase leading-[13px] tracking-[0.2em]"
            style={{ color: "#7a4a21" }}
          >
            {t("paywall.product")}
          </p>
          <h2
            id="offer-heading"
            className="daybreak-heading mt-3 text-[26px] font-extrabold leading-[30px] text-[color:var(--day-ink)]"
          >
            {t("paywall.v2.title_before")}
            <span className="text-[color:var(--app-accent,#6d5ba8)]">
              {t("paywall.v2.title_emphasis")}
            </span>
          </h2>
          <p className="mx-auto mt-2 max-w-[34ch] text-[13px] font-normal leading-[18px] text-[color:var(--day-ink-3)] md:max-w-[54ch]">
            {t("paywall.v2.body")}
          </p>

          <ul className="mt-6 flex flex-col gap-3 rounded-[20px] bg-[color:var(--day-bg)] p-4 text-start">
            {CHECKS.map((key) => (
              <li key={key} className="flex items-center gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[rgba(61,138,115,0.15)]">
                  <Check
                    size={12}
                    strokeWidth={2.5}
                    className="text-[#3d8a73]"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-[13px] font-semibold leading-[17px] text-[color:var(--day-ink)]">
                  {t(key)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-end justify-center gap-x-2">
            <span className="daybreak-heading text-[36px] font-extrabold leading-[40px] tabular-nums text-[color:var(--day-ink)]">
              {price}
            </span>
            {hasOfferDiscount(offer) && (
              <>
                <s className="pb-1 text-[14px] font-semibold leading-[18px] tabular-nums text-[#9e8e7e]">
                  <span className="sr-only">{listPrice}</span>
                  <span aria-hidden="true">{listPrice}</span>
                </s>
                <span className="mb-1 rounded-full bg-[rgba(242,201,76,0.22)] px-2.5 py-1 text-[10px] font-bold leading-[13px] text-[#7a5a00]">
                  {fill(t("paywall.offer.percent_off"), {
                    percent: String(offer.discountPercent),
                  })}
                </span>
              </>
            )}
          </div>

          <p className="mt-1 text-[11.5px] font-normal leading-[15px] text-[#9e8e7e]">
            {t("paywall.v2.parent_summary")}
          </p>

          <button
            type="button"
            className="mt-5 inline-flex min-h-[51px] w-full items-center justify-center gap-2 rounded-full bg-[#221248] px-6 text-[15px] font-bold leading-[19px] text-[#fffcf6] shadow-[0_12px_24px_rgba(34,18,72,0.2)] transition hover:bg-[#34205f] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d5ba8]"
            onClick={onOpen}
          >
            {t("paywall.v2.cta")}
            <ArrowRight
              size={18}
              strokeWidth={2.2}
              className="flip-rtl"
              aria-hidden="true"
            />
          </button>

          <p className="mt-3 text-[11px] font-semibold leading-[14px] text-[#9e8e7e]">
            {t("paywall.v2.secure")}
          </p>
        </section>
      </div>
    </div>
  );
}
