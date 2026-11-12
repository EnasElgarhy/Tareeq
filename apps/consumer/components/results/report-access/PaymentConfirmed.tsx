"use client";

import { ArrowRight, X } from "@phosphor-icons/react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ReportOffer } from "@/lib/payments/report-access";
import {
  fill,
  formatOfferListPrice,
  formatOfferPrice,
  formatOfferSaving,
} from "@/components/results/report-access/story/story-data";

export const SUPPORT_EMAIL = "support@mapmycore.com";

interface PaymentConfirmedProps {
  offer: ReportOffer;
  /** Where Stripe sends the receipt; the line is left out when unknown. */
  email: string;
  onOpenReport(): void;
}

/**
 * What the checkout window turns into once the server has the payment:
 * a gold tick, what was paid, and one way on, into the report.
 */
export function PaymentConfirmed({
  offer,
  email,
  onOpenReport,
}: PaymentConfirmedProps) {
  const { locale, t } = useLocale();
  const price = formatOfferPrice(offer, locale);
  const saving = formatOfferSaving(offer, locale);

  return (
    <div className="relative flex flex-col items-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 text-center sm:px-8 sm:pt-10">
      <button
        type="button"
        onClick={onOpenReport}
        aria-label={t("paywall.done.open")}
        className="absolute end-4 top-4 grid size-11 place-items-center rounded-full border border-sand/10 bg-sand/[0.05] text-sand/70 transition hover:bg-sand/[0.09] hover:text-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <X size={18} aria-hidden="true" />
      </button>

      <div
        aria-hidden="true"
        className="anim-paid-ring relative grid size-[76px] place-items-center rounded-full bg-gold shadow-[0_0_0_10px_rgba(244,198,96,0.12),0_18px_48px_-12px_rgba(244,198,96,0.55)]"
      >
        <svg viewBox="0 0 24 24" className="size-9" fill="none">
          <path
            className="anim-paid-tick"
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="#14101F"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p className="anim-paid-rise mt-6 text-[12px] font-semibold text-gold [animation-delay:420ms]">
        {t("paywall.done.label")}
      </p>
      <h2
        id="checkout-title"
        className="anim-paid-rise mt-1.5 max-w-[18ch] text-[24px] font-bold leading-tight text-sand [animation-delay:480ms] sm:text-[26px]"
      >
        {t("paywall.done.title")}
      </h2>
      <p
        id="checkout-description"
        className="anim-paid-rise mt-3 max-w-[40ch] text-[13.5px] leading-6 text-sand/65 [animation-delay:540ms]"
      >
        {t("paywall.done.body")}
      </p>

      <dl className="anim-paid-rise mt-6 w-full rounded-[16px] border border-sand/10 bg-sand/[0.045] p-4 text-start text-[13px] [animation-delay:620ms]">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="font-semibold text-sand">{t("paywall.product")}</dt>
          <dd className="text-sand/60">
            {saving ? formatOfferListPrice(offer, locale) : price}
          </dd>
        </div>
        {saving ? (
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <dt className="text-sand/60">{t("paywall.done.offer")}</dt>
            <dd className="font-semibold text-gold">−{saving}</dd>
          </div>
        ) : null}
        <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-sand/10 pt-3">
          <dt className="font-semibold text-sand">{t("paywall.done.paid")}</dt>
          <dd className="text-[17px] font-bold text-sand">{price}</dd>
        </div>
        {email ? (
          <p className="mt-3 break-words text-[12px] leading-5 text-sand/50">
            {fill(t("paywall.done.receipt"), { email })}
          </p>
        ) : null}
      </dl>

      <button
        type="button"
        onClick={onOpenReport}
        autoFocus
        className="btn-v2 btn-v2--primary anim-paid-rise mt-6 w-full [animation-delay:700ms]"
        data-size="lg"
      >
        {t("paywall.done.open")}
        <ArrowRight
          size={18}
          weight="bold"
          className="flip-rtl"
          aria-hidden="true"
        />
      </button>

      <p className="anim-paid-rise mt-4 text-[12px] text-sand/50 [animation-delay:760ms]">
        {t("paywall.done.help")}{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-semibold text-gold underline-offset-2 hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  );
}
