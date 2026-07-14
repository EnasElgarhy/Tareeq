import {
  fetchAnswerOutcomePairs,
  fetchAssessmentBaselineMedianTimeMs,
  fetchQuestionEvents,
  getQuestionById,
  listSiblingQuestionVersions,
  type QuestionWithVersion,
} from "@/lib/admin/analytics/question-queries";
import {
  computeQuestionMetrics,
  type QuestionEventRecord,
  type QuestionMetrics,
} from "@/lib/admin/analytics/question-events";
import { computeQuestionHealth, type HealthScoreResult } from "@/lib/admin/analytics/question-health";
import { generateQuestionInsights } from "@/lib/admin/analytics/question-insights";
import {
  computeOutcomeCorrelation,
  type QuestionOutcomeCorrelation,
} from "@/lib/admin/analytics/question-correlation";
import {
  compareQuestionVersions,
  type QuestionVersionComparison,
} from "@/lib/admin/analytics/question-version-comparison";
import type { Insight } from "@/lib/admin/analytics/types";

/** "Q5" → "Question 5"; anything else (QD1, QT3, ...) is left as-is —
 * those aren't the numbered core-pillar questions the spec's own examples
 * ("Question 18 has the highest abandonment") are modeled on. */
export function questionLabel(externalId: string): string {
  const match = /^Q(\d+)$/.exec(externalId);
  return match ? `Question ${match[1]}` : externalId;
}

export interface QuestionAnalyticsViewModel {
  question: QuestionWithVersion;
  label: string;
  hasDiscreteAnswers: boolean;
  metrics: QuestionMetrics;
  health: HealthScoreResult;
  insights: Insight[];
  correlation: QuestionOutcomeCorrelation;
  siblingVersions: QuestionWithVersion[];
  /** Most recent 20 events, newest first — a simple activity feed rather
   * than a full time-series chart (see QUESTION_ANALYTICS_ARCHITECTURE.md
   * Known Gaps: this is Phase 3's Timeline section, intentionally kept
   * simple pending real traffic to visualize). */
  recentEvents: QuestionEventRecord[];
  /** Comparison against the most recently created sibling version, if any
   * exist — null (not an error) when this question has no other version
   * to compare against yet. */
  comparisonToSibling: {
    sibling: QuestionWithVersion;
    result: QuestionVersionComparison;
  } | null;
}

/**
 * Assembles everything the /admin/questions/[id]/analytics page needs in
 * one call — mirrors the existing getAnalyticsViewModel() orchestrator
 * pattern in lib/admin/analytics/queries.ts. Returns null only when the
 * question id itself doesn't resolve (deleted/never existed); every other
 * "no data yet" case is represented inside the view model (null health
 * score, empty insights, no correlation, no sibling), not by throwing.
 */
export async function getQuestionAnalyticsViewModel(
  questionId: string,
): Promise<QuestionAnalyticsViewModel | null> {
  const question = await getQuestionById(questionId);
  if (!question) return null;

  const hasDiscreteAnswers = question.kind !== "text";

  const [events, baselineMedianTimeMs, correlationPairs, siblingVersions] = await Promise.all([
    fetchQuestionEvents(question.external_id),
    fetchAssessmentBaselineMedianTimeMs(question.version_label),
    fetchAnswerOutcomePairs(question.external_id, "topCluster"),
    listSiblingQuestionVersions(question.external_id, question.version_id),
  ]);

  const metrics = computeQuestionMetrics(events);
  const health = computeQuestionHealth({
    metrics,
    hasDiscreteAnswers,
    optionCount: question.options.length,
    baselineMedianTimeMs,
  });
  const label = questionLabel(question.external_id);
  const insights = generateQuestionInsights([
    { externalId: question.external_id, label, metrics, health },
  ]);
  const correlation = computeOutcomeCorrelation(correlationPairs, "topCluster");

  let comparisonToSibling: QuestionAnalyticsViewModel["comparisonToSibling"] = null;
  if (siblingVersions.length > 0) {
    const sibling = siblingVersions[0];
    const siblingEvents = await fetchQuestionEvents(question.external_id, {
      versionLabel: sibling.version_label ?? undefined,
    });
    const siblingMetrics = computeQuestionMetrics(siblingEvents);
    const siblingBaseline = await fetchAssessmentBaselineMedianTimeMs(sibling.version_label);
    const siblingHealth = computeQuestionHealth({
      metrics: siblingMetrics,
      hasDiscreteAnswers: sibling.kind !== "text",
      optionCount: sibling.options.length,
      baselineMedianTimeMs: siblingBaseline,
    });
    comparisonToSibling = {
      sibling,
      result: compareQuestionVersions(
        {
          versionLabel: sibling.version_label ?? "unlabeled version",
          title: sibling.title,
          options: sibling.options.map((o) => ({ letter: o.letter, text: o.text })),
          metrics: siblingMetrics,
          health: siblingHealth,
        },
        {
          versionLabel: question.version_label ?? "unlabeled version",
          title: question.title,
          options: question.options.map((o) => ({ letter: o.letter, text: o.text })),
          metrics,
          health,
        },
      ),
    };
  }

  const recentEvents = [...events]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 20);

  return {
    question,
    label,
    hasDiscreteAnswers,
    metrics,
    health,
    insights,
    recentEvents,
    correlation,
    siblingVersions,
    comparisonToSibling,
  };
}
