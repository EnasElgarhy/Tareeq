"use client";

import type { ReactNode } from "react";
import {
  AchievementIcon,
  CareerCompassIcon,
  DeepDiveIcon,
  SkillIcon,
  StreakIcon,
} from "@/components/brand/DomainIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Achievement } from "@/lib/profile/activity";

const ACHIEVEMENT_VISUALS: Record<string, { icon: ReactNode; background: string; barColor: string }> = {
  joined: {
    icon: <CareerCompassIcon size={18} />,
    background: "linear-gradient(135deg, rgba(157,127,240,0.2), rgba(110,72,228,0.07))",
    barColor: "#6E48E4",
  },
  core_complete: {
    icon: <AchievementIcon size={18} />,
    background: "linear-gradient(135deg, rgba(244,198,96,0.2), rgba(253,231,168,0.08))",
    barColor: "#F4C660",
  },
  deep_dive: {
    icon: <DeepDiveIcon size={18} />,
    background: "linear-gradient(135deg, rgba(111,224,192,0.2), rgba(111,224,192,0.07))",
    barColor: "#6FE0C0",
  },
  skills_audit: {
    icon: <SkillIcon size={18} />,
    background: "linear-gradient(135deg, rgba(255,107,61,0.18), rgba(255,165,61,0.07))",
    barColor: "#FF6B3D",
  },
  consistent: {
    icon: <StreakIcon size={18} />,
    background: "linear-gradient(135deg, rgba(242,168,179,0.24), rgba(242,168,179,0.08))",
    barColor: "#F2A8B3",
  },
};

/**
 * The Home tab's day-themed achievement list — same real data as
 * components/assessment/ProfileScreen.tsx's achievements section
 * (lib/profile/activity.ts's deriveAchievements), restyled for the
 * warm-paper surface. Unearned entries stay visible (locked, dimmed) so
 * a brand-new user sees what's ahead, not an empty trophy case.
 */
export function AchievementsCard({ achievements }: { achievements: Achievement[] }) {
  const { t } = useLocale();

  return (
    <article className="grid gap-2.5">
      <p className="daybreak-heading col-span-full ps-0.5 text-[18px] text-[color:var(--day-ink)]">
        {t("profile.overview.achievements_title")}
      </p>
      {achievements.map((achievement) => {
        const visual = ACHIEVEMENT_VISUALS[achievement.id];
        return (
          <div
            key={achievement.id}
            className="relative flex min-h-[76px] items-center gap-3 overflow-hidden rounded-xl border border-[color:var(--day-line)] p-3.5"
            style={{
              background: achievement.achieved ? "var(--day-card)" : "var(--day-inset)",
              boxShadow: achievement.achieved
                ? "0 10px 28px rgba(42,33,24,0.06)"
                : "none",
              opacity: achievement.achieved ? 1 : 0.6,
            }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 start-0 w-[3px]"
              style={{ background: achievement.achieved ? visual?.barColor : "rgba(43,36,28,0.12)" }}
            />
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl"
              style={{ background: achievement.achieved ? visual?.background : "rgba(43,36,28,0.05)" }}
            >
              {visual?.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="daybreak-heading text-[14px] leading-tight"
                style={{
                  color: achievement.achieved ? "var(--day-ink)" : "var(--day-ink-3)",
                }}
              >
                {t(achievement.labelKey)}
              </p>
              <p className="mt-1 text-[11.5px] leading-snug text-[color:var(--day-ink-3)]">
                {t(achievement.subLabelKey)}
              </p>
            </div>
          </div>
        );
      })}
    </article>
  );
}
