import { daysSince } from "@/lib/admin/users/time";
import type {
  EngagementFactor,
  EngagementResult,
  UserAggregate,
} from "@/lib/admin/users/types";

/**
 * Deterministic engagement summary — deliberately SEPARATE from risk. A user
 * can be low-engagement without being high-risk (e.g. a brand-new account) and
 * high-risk while once highly engaged (e.g. active then dormant). Positive
 * points only; every factor is shown so the number is never a black box.
 */

const HIGH_THRESHOLD = 6;
const MEDIUM_THRESHOLD = 3;

export function computeEngagement(agg: UserAggregate, nowIso: string): EngagementResult {
  const factors: EngagementFactor[] = [];

  if (agg.assessmentsCompleted > 0) {
    factors.push({
      code: "completed_assessments",
      label: `Completed ${agg.assessmentsCompleted} assessment${agg.assessmentsCompleted === 1 ? "" : "s"}`,
      points: Math.min(agg.assessmentsCompleted, 3),
    });
  }
  if (agg.resultsViewed) {
    factors.push({ code: "viewed_results", label: "Viewed their results", points: 1 });
  }
  if (agg.kaiSessions > 0) {
    factors.push({
      code: "kai_sessions",
      label: `${agg.kaiSessions} Kai session${agg.kaiSessions === 1 ? "" : "s"}`,
      points: Math.min(agg.kaiSessions, 3),
    });
  }
  if (agg.plansSaved > 0) {
    factors.push({
      code: "saved_plans",
      label: `Saved ${agg.plansSaved} plan${agg.plansSaved === 1 ? "" : "s"}`,
      points: 1,
    });
  }
  if (agg.tasksCompleted > 0) {
    factors.push({
      code: "completed_tasks",
      label: `Completed ${agg.tasksCompleted} plan task${agg.tasksCompleted === 1 ? "" : "s"}`,
      points: Math.min(agg.tasksCompleted, 2),
    });
  }

  const idleDays = daysSince(agg.lastActiveAt, nowIso);
  if (idleDays !== null && idleDays <= 7) {
    factors.push({ code: "recent_7d", label: "Active in the last 7 days", points: 2 });
  } else if (idleDays !== null && idleDays <= 30) {
    factors.push({ code: "recent_30d", label: "Active in the last 30 days", points: 1 });
  }

  const score = factors.reduce((sum, f) => sum + f.points, 0);
  const level = score >= HIGH_THRESHOLD ? "high" : score >= MEDIUM_THRESHOLD ? "medium" : "low";
  return { level, score, factors };
}
