"use client";

import { StreakIcon } from "@/components/brand/DomainIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { StringKey } from "@/lib/i18n/strings";
import type { StreakInfo } from "@/lib/profile/streak";

const DAY_KEYS: StringKey[] = [
  "profile.streak.day.mon",
  "profile.streak.day.tue",
  "profile.streak.day.wed",
  "profile.streak.day.thu",
  "profile.streak.day.fri",
  "profile.streak.day.sat",
  "profile.streak.day.sun",
];

/**
 * The Home tab's day-themed streak card — same data/rule as
 * components/assessment/StreakCard.tsx ("any app visit counts as a
 * day," see lib/profile/streak.ts), restyled for the warm-paper surface.
 * The flame is the hero here — paired directly with the count instead
 * of tucked into a small corner badge — with a soft warm wash behind it
 * so the card reads as "something is burning," not just a stat block.
 */
export function StreakCard({ streak }: { streak: StreakInfo }) {
  const { t } = useLocale();

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-[color:var(--day-line)] bg-[color:var(--day-card)] p-4 shadow-[var(--day-shadow-card)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-10 size-[140px] rounded-full opacity-70"
        style={{ background: "radial-gradient(circle, rgba(244,198,96,0.24), rgba(244,198,96,0) 70%)" }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--day-ink-3)]">
          {t("profile.streak.title")}
        </p>
        {!streak.badgeUnlocked ? (
          <span
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
            style={{ background: "rgba(244,198,96,0.18)", color: "#6B4D00" }}
          >
            {t("profile.streak.to_go").replace("{n}", String(streak.daysUntilBadge))}
          </span>
        ) : null}
      </div>

      <div className="relative mt-2 flex items-center gap-3">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-[18px]"
          style={{ background: "linear-gradient(150deg, rgba(244,198,96,0.22), rgba(255,107,61,0.1))" }}
        >
          <StreakIcon size={34} />
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[34px] font-black leading-none tabular-nums text-[color:var(--day-ink)]">
            {streak.count}
          </span>
          <span className="text-[12.5px] font-semibold text-[color:var(--day-ink-2)]">
            {t("profile.streak.count_label")}
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex gap-1.5">
        {streak.weekVisited.map((visited, i) => (
          <div key={DAY_KEYS[i]} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={`grid size-8 place-items-center rounded-[10px] ${visited ? "" : "border border-dashed border-[color:var(--day-line-strong,rgba(43,36,28,0.18))]"}`}
              style={
                visited
                  ? { background: "var(--gold-gradient)", boxShadow: "0 4px 10px rgba(244,198,96,0.35)" }
                  : undefined
              }
            >
              {visited ? <StreakIcon size={16} /> : null}
            </span>
            <span className="text-[9.5px] font-semibold text-[color:var(--day-ink-3)]">
              {t(DAY_KEYS[i]!)}
            </span>
          </div>
        ))}
      </div>

      {!streak.badgeUnlocked ? (
        <p className="relative mt-3 text-[12px] leading-relaxed text-[color:var(--day-ink-2)]">
          {t("profile.streak.note")
            .replace("{days}", String(streak.daysUntilBadge))
            .replace("{badge}", t("profile.achievement.consistent"))}
        </p>
      ) : null}
    </article>
  );
}
