"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

/**
 * The Overview greeting: "Hello, {first name}" and the avatar that opens the
 * You tab. Shared by the legacy Overview and the CORE 2.0 one.
 */
export function OverviewHeader({
  name,
  nudge,
}: {
  /** The student's registered name, or null before they have registered. */
  name: string | null;
  /** Optional quiet line under the greeting. */
  nudge?: string | null;
}) {
  const { t } = useLocale();
  const fullName = name ?? "there";
  return (
    <header className="daybreak-reveal flex items-center justify-between gap-3 pt-1">
      <div className="min-w-0">
        <p className="daybreak-eyebrow">✦ {t("home.hero.eyebrow")}</p>
        <h1 className="daybreak-heading mt-1 text-[30px] leading-[1.05] text-[color:var(--day-ink)] sm:text-[36px]">
          {t("home.overview.greeting").replace("{name}", firstNameOf(fullName))}
        </h1>
        {nudge ? (
          <p className="mt-0.5 text-[11.5px] text-[color:var(--day-ink-3)]">{nudge}</p>
        ) : null}
      </div>
      <Link
        href="/you"
        aria-label={t("home.overview.avatar_label")}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-[color:var(--day-line)] bg-[color:var(--day-elevated)] font-heading text-[13px] font-bold text-[color:var(--day-ink-2)] shadow-[var(--day-shadow-card)] transition active:scale-95"
      >
        {name ? initialsOf(fullName) : "T"}
      </Link>
    </header>
  );
}
