"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface TabPlaceholderProps {
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  eyebrow: string;
  title: string;
  description: string;
  /** Short preview of what's coming, as bullet chips. */
  preview: string[];
}

/**
 * A designed "coming soon" surface for tabs that aren't built yet. Keeps
 * the tab bar fully navigable and tells the user what each tab will hold,
 * rather than dropping them on a dead screen.
 */
export function TabPlaceholder({
  icon: Icon,
  eyebrow,
  title,
  description,
  preview,
}: TabPlaceholderProps) {
  const { t } = useLocale();
  return (
    <section className="daybreak-reveal flex flex-1 flex-col items-center justify-center gap-5 px-2 py-8 text-center">
      <span className="rounded-story grid size-16 place-items-center border border-[#413664] bg-[#221248] text-[#F2C94C] shadow-[0_18px_34px_rgba(34,18,72,0.2)]">
        <Icon size={28} strokeWidth={1.8} />
      </span>
      <div className="grid gap-2">
        <p className="daybreak-eyebrow">
          {eyebrow}
          {t("home.placeholder.coming_soon_suffix")}
        </p>
        <h1 className="daybreak-heading text-[30px] leading-tight text-[color:var(--day-ink)] lg:text-[38px]">
          {title}
        </h1>
        <p className="mx-auto max-w-[34ch] text-[13.5px] leading-relaxed text-[color:var(--day-ink-2)]">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {preview.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[color:var(--day-line)] bg-[color:var(--day-card)] px-3 py-1.5 text-[11px] font-semibold text-[color:var(--day-ink-2)] shadow-[0_5px_12px_rgba(74,57,39,0.05)]"
          >
            {item}
          </span>
        ))}
      </div>
      <Link
        href="/home"
        className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--day-ink-3)] transition hover:text-[color:var(--day-ink)]"
      >
        <ArrowLeft size={14} />
        {t("home.placeholder.back_to_overview")}
      </Link>
    </section>
  );
}
