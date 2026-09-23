"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * The opening beat above the dark hero card, straight from the Figma frame:
 * eyebrow, the display headline, one supporting line — all on the paper.
 */
export function PaywallHeader() {
  const { t } = useLocale();

  return (
    <header className="pb-2 pt-7">
      <p
        className="text-[10px] font-bold uppercase leading-[13px] tracking-[0.2em]"
        style={{ color: "#7a4a21" }}
      >
        {t("paywall.v2.eyebrow")}
      </p>
      <h1
        id="reveal-heading"
        className="daybreak-heading mt-2 text-[30px] font-extrabold leading-[34px]"
        style={{ color: "#2a2118" }}
      >
        {t("paywall.v2.headline")}
      </h1>
      <p
        className="mt-2 max-w-[52ch] text-[14px] font-normal leading-[20px]"
        style={{ color: "#675d4e" }}
      >
        {t("paywall.v2.sub")}
      </p>
    </header>
  );
}
