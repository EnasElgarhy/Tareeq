import type { StringKey } from "@/lib/i18n/strings";
import { getClusterLabel } from "@/lib/results/cluster-visuals";
import type { PersonalizedCompassReport } from "@/lib/results/types";

/**
 * Conversation-starter questions for the Kai tab's landing — same
 * profile-derived framing as the Home feed's "Ask Kai" card (see
 * lib/home/feed.ts), so the recommendation the user sees on Home and
 * the one they see once they're actually on the Kai tab feel like the
 * same guide, not two different products. Kept separate from feed.ts
 * since these are Kai-chat-specific starters, not home-feed cards.
 */
export function buildKaiStarterPrompts(
  report: PersonalizedCompassReport,
  t: (key: StringKey) => string,
): string[] {
  const cluster = getClusterLabel(report.clusterCode, t);
  const topCareer = report.careerExamples[0];
  const topMajor = report.universityMajors[0];

  const prompts: string[] = [t("kai.starters.explore_cluster").replace("{cluster}", cluster)];
  if (topCareer) prompts.push(t("kai.starters.career_day").replace("{career}", topCareer));
  if (topMajor) prompts.push(t("kai.starters.major_study").replace("{major}", topMajor));

  return prompts;
}
