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

/** "Any app visit counts as a day" — the streak's day-counting rule,
 * decided as the simplest option rather than requiring a completed
 * conversation or journey action. See lib/profile/streak.ts. */
export function StreakCard({ streak }: { streak: StreakInfo }) {
  const { t } = useLocale();

  return (
    <div className="rounded-[20px] border border-carbon/8 bg-white p-3.5 shadow-[0_8px_20px_rgba(43,36,28,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[26px] font-black italic leading-none text-carbon">
            {streak.count}
          </span>
          <span className="text-[12px] font-semibold text-carbon/60">{t("profile.streak.count_label")}</span>
        </div>
        {!streak.badgeUnlocked ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1.5 text-[10.5px] font-bold text-[#8A6A16]">
            <StreakIcon size={12} />
            {t("profile.streak.to_go").replace("{n}", String(streak.daysUntilBadge))}
          </span>
        ) : null}
      </div>

      <div className="mt-3.5 flex gap-1.5">
        {streak.weekVisited.map((visited, i) => (
          <div key={DAY_KEYS[i]} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className="grid size-8 place-items-center rounded-[10px]"
              style={
                visited
                  ? { background: "var(--gold-gradient)", boxShadow: "0 4px 10px rgba(244,198,96,0.4)" }
                  : { background: "rgba(20,16,31,0.06)" }
              }
            >
              {visited ? <StreakIcon size={15} /> : null}
            </span>
            <span className="text-[9.5px] font-semibold text-carbon/40">{t(DAY_KEYS[i]!)}</span>
          </div>
        ))}
      </div>

      {!streak.badgeUnlocked ? (
        <p className="mt-3 text-[12px] leading-relaxed text-carbon/60">
          {t("profile.streak.note")
            .replace("{days}", String(streak.daysUntilBadge))
            .replace("{badge}", t("profile.achievement.consistent"))}
        </p>
      ) : null}
    </div>
  );
}
