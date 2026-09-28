"use client";

import { ArrowRight, Flask } from "@phosphor-icons/react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** Rounded credibility pill above the hero headline, linking to the research page. */
export const ScienceBanner = () => {
  const { t } = useLocale();
  return (
    <Link
      href="/research"
      className="group inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pe-3.5 ps-1.5 text-[12.5px] sm:gap-2.5 sm:pe-4 sm:text-[13.5px] backdrop-blur-md transition-colors hover:border-[#F4C660]/40 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4C660]"
    >
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full bg-[#F4C660]/[0.14] text-[#F4C660]"
      >
        <Flask size={15} weight="duotone" />
      </span>
      <span className="text-[#F5EEE6]/85">
        {t("marketing.hero.sci_banner")}
      </span>
      <span className="flex shrink-0 items-center gap-1 font-semibold text-[#F4C660]">
        <span className="hidden sm:inline">{t("marketing.hero.sci_link")}</span>
        <ArrowRight
          aria-hidden="true"
          size={13}
          weight="bold"
          className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
        />
      </span>
    </Link>
  );
};
