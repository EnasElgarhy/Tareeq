import { daysSince } from "@/lib/admin/users/time";
import type { RiskReason, RiskResult, Severity, UserAggregate } from "@/lib/admin/users/types";

/**
 * Deterministic, transparent student risk indicator. NO LLM, no hidden score:
 * every level is the sum of explicit, explainable signal severities. A key
 * rule from the brief — the ABSENCE of data is never risk. A brand-new user
 * with nothing recorded yet is `healthy`, not `high_risk`.
 */

const SEVERITY_WEIGHT: Record<Severity, number> = { low: 1, medium: 2, high: 3 };

const INACTIVE_HIGH_DAYS = 90;
const INACTIVE_MED_DAYS = 30;

export function computeRisk(agg: UserAggregate, nowIso: string): RiskResult {
  const reasons: RiskReason[] = [];

  // Started an assessment and never finished it.
  if (agg.assessmentsStarted > 0 && agg.assessmentsCompleted < agg.assessmentsStarted) {
    reasons.push({
      code: "assessment_abandoned",
      label: "Started an assessment but didn't finish it",
      severity: "medium",
    });
  }

  // Completed the Compass but never looked at the result.
  if (agg.hasCompassResult && !agg.resultsViewed) {
    reasons.push({
      code: "results_never_viewed",
      label: "Completed the Compass but never viewed the results",
      severity: "medium",
    });
  }

  // Saw results but never engaged the guide.
  if (agg.resultsViewed && !agg.kaiOpened) {
    reasons.push({
      code: "kai_never_opened",
      label: "Viewed results but never opened Kai",
      severity: "low",
    });
  }

  // Saved a plan but never acted on it.
  if (agg.plansSaved > 0 && agg.tasksCompleted === 0) {
    reasons.push({
      code: "plan_no_progress",
      label: "Saved a plan but completed no tasks",
      severity: "low",
    });
  }

  // Inactivity — measured from last real activity, or from registration when
  // the user has never been active. Absence of a timestamp = unknown, not risk.
  const referenceIso = agg.lastActiveAt ?? agg.registeredAt;
  const idleDays = daysSince(referenceIso, nowIso);
  if (idleDays !== null) {
    if (idleDays >= INACTIVE_HIGH_DAYS) {
      reasons.push({
        code: "inactive_90_days",
        label: "Inactive for more than 90 days",
        severity: "high",
      });
    } else if (idleDays >= INACTIVE_MED_DAYS) {
      reasons.push({
        code: "inactive_30_days",
        label: "Inactive for more than 30 days",
        severity: "medium",
      });
    }
  }

  const score = reasons.reduce((sum, r) => sum + SEVERITY_WEIGHT[r.severity], 0);
  const level = score >= 3 ? "high_risk" : score >= 1 ? "needs_attention" : "healthy";
  return { level, score, reasons };
}
