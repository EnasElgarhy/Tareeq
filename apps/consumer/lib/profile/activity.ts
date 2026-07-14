import type { StringKey } from "@/lib/i18n/strings";
import type { ProfileSnapshot } from "@/lib/profile/journey";

export interface ActivityEntry {
  labelKey: StringKey;
  at: string;
}

/**
 * A short, honest activity list derived purely from timestamps the app
 * already has (report generation, registration) — no new tracking or
 * storage. Newest first.
 */
export function deriveRecentActivity(snapshot: ProfileSnapshot): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  if (snapshot.coreReport) {
    entries.push({ labelKey: "profile.activity.core_complete", at: snapshot.coreReport.generatedAt });
  }
  if (snapshot.registration?.verifiedAt) {
    entries.push({ labelKey: "profile.activity.profile_created", at: snapshot.registration.verifiedAt });
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export interface NextMilestone {
  name: string;
  tagline: string;
}

/** The next module still ahead — the first one that isn't completed yet. */
export function deriveNextMilestone(snapshot: ProfileSnapshot): NextMilestone | null {
  const next = snapshot.modules.find((m) => m.status !== "completed");
  return next ? { name: next.name, tagline: next.tagline } : null;
}

/** Sums the leading number out of each not-yet-completed module's
 * `durationLabel` (e.g. "12 min", "~25 min") — a rough total, not a
 * precise estimate, so the Journey header can say "~40 min left"
 * instead of just a completed-count badge. */
export function deriveMinutesRemaining(snapshot: ProfileSnapshot): number {
  return snapshot.modules
    .filter((m) => m.status !== "completed")
    .reduce((total, m) => {
      const match = m.durationLabel.match(/(\d+)/);
      return total + (match ? Number(match[1]) : 0);
    }, 0);
}

export interface Achievement {
  id: string;
  labelKey: StringKey;
  subLabelKey: StringKey;
  achieved: boolean;
}

/**
 * Derived purely from module/report state already in the snapshot (plus
 * an optional streak-badge flag, computed separately by
 * lib/profile/streak.ts — kept as a plain boolean parameter rather than
 * importing StreakInfo here, so this module doesn't need to know
 * anything about how streaks are computed). Unearned entries stay in
 * the list (marked `achieved: false`) so this reads as progress toward
 * something, not just a trophy case that's empty for new users.
 */
export function deriveAchievements(snapshot: ProfileSnapshot, streakBadgeUnlocked = false): Achievement[] {
  const moduleStatus = (id: string) => snapshot.modules.find((m) => m.id === id)?.status;

  return [
    {
      id: "joined",
      labelKey: "profile.achievement.joined",
      subLabelKey: "profile.achievement.joined_sub",
      achieved: Boolean(snapshot.registration?.verifiedAt),
    },
    {
      id: "core_complete",
      labelKey: "profile.achievement.core_complete",
      subLabelKey: "profile.achievement.core_complete_sub",
      achieved: Boolean(snapshot.coreReport),
    },
    {
      id: "deep_dive",
      labelKey: "profile.achievement.deep_dive",
      subLabelKey: "profile.achievement.deep_dive_sub",
      achieved: moduleStatus("deep-dive") === "completed",
    },
    {
      id: "skills_audit",
      labelKey: "profile.achievement.skills_audit",
      subLabelKey: "profile.achievement.skills_audit_sub",
      achieved: moduleStatus("skills-audit") === "completed",
    },
    {
      id: "consistent",
      labelKey: "profile.achievement.consistent",
      subLabelKey: "profile.achievement.consistent_sub",
      achieved: streakBadgeUnlocked,
    },
  ];
}
