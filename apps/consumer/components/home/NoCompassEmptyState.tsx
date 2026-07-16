"use client";

import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** Shown on any (app) tab when the user hasn't taken the CORE Compass
 * yet — every tab's content is personalized to a result, so there's
 * nothing to show until one exists. */
export function NoCompassEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useLocale();
  return (
    <section className="daybreak-reveal flex flex-1 flex-col items-center justify-center gap-4 px-2 py-8 text-center">
      <span className="rounded-story grid size-16 place-items-center border border-[#413664] bg-[#221248] text-[#F2C94C] shadow-[0_18px_34px_rgba(34,18,72,0.2)]">
        <Compass size={28} strokeWidth={1.8} />
      </span>
      <div className="grid gap-1.5">
        <h1 className="daybreak-heading text-[28px] leading-tight text-[color:var(--day-ink)]">{title}</h1>
        <p className="mx-auto max-w-[32ch] text-[13.5px] leading-relaxed text-[color:var(--day-ink-2)]">
          {description}
        </p>
      </div>
      <Link href="/start" className="btn-v2 btn-v2--primary" data-size="lg">
        {t("home.empty.start_cta")}
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}
