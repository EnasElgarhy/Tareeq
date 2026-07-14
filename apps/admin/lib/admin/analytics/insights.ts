import {
  average,
  percentage,
  qualityScorePct,
  retakeRatePct,
  tally,
} from "@/lib/admin/analytics/aggregate";
import type { DerivedRow, Insight } from "@/lib/admin/analytics/types";
import { CLUSTERS } from "@/lib/admin/clusters";

/**
 * Deterministic "what changed" insight generators — current vs. previous
 * period. Each rule only fires above a minimum sample size and a minimum
 * change threshold, so a near-empty dataset produces silence rather than
 * noisy or misleading insights. Designed to be swapped for an LLM-generated
 * feed later without changing the `Insight` shape callers consume.
 */

const MIN_SAMPLE = 5;
const MIN_ABANDON_SAMPLE = 3;
const MIN_POINT_CHANGE = 5;
const MIN_PCT_CHANGE = 10;

function clusterLabel(code: string): string {
  return CLUSTERS.find((c) => c.code === code)?.name ?? code;
}

function dataQuality(rows: DerivedRow[]) {
  const suspicious = rows.filter((r) => r.isFlagged).length;
  return {
    rushedCount: rows.filter((r) => r.isRushed).length,
    veryLongCount: rows.filter((r) => r.isVeryLong).length,
    allSameAnswerCount: rows.filter((r) => r.isAllSameAnswer).length,
    missingAnswersCount: rows.filter((r) => (r.missingCount ?? 0) > 0).length,
    suspiciousCount: suspicious,
    cleanCount: rows.length - suspicious,
    totalCount: rows.length,
  };
}

function clusterMoverInsight(
  current: DerivedRow[],
  previous: DerivedRow[],
): Insight | null {
  const curCore = current.filter((r) => r.coreResult);
  const prevCore = previous.filter((r) => r.coreResult);
  if (curCore.length < MIN_SAMPLE || prevCore.length < MIN_SAMPLE) return null;

  const curShare = new Map(
    tally(curCore, (r) => r.coreResult!.topCluster ?? "unknown").map((e) => [
      e.key,
      e.pct,
    ]),
  );
  const prevShare = new Map(
    tally(prevCore, (r) => r.coreResult!.topCluster ?? "unknown").map((e) => [
      e.key,
      e.pct,
    ]),
  );

  let biggestKey: string | null = null;
  let biggestDelta = 0;
  for (const [key, pct] of curShare) {
    const delta = pct - (prevShare.get(key) ?? 0);
    if (Math.abs(delta) > Math.abs(biggestDelta)) {
      biggestDelta = delta;
      biggestKey = key;
    }
  }
  if (!biggestKey || biggestKey === "unknown" || Math.abs(biggestDelta) < MIN_POINT_CHANGE) {
    return null;
  }

  const direction = biggestDelta > 0 ? "increased" : "decreased";
  return {
    id: "cluster-mover",
    severity: "info",
    text: `${clusterLabel(biggestKey)} interest ${direction} ${Math.abs(
      Math.round(biggestDelta),
    )} points this period.`,
  };
}

function completionTimeInsight(
  current: DerivedRow[],
  previous: DerivedRow[],
): Insight | null {
  const curDurations = current
    .map((r) => r.durationSeconds)
    .filter((d): d is number => d !== null);
  const prevDurations = previous
    .map((r) => r.durationSeconds)
    .filter((d): d is number => d !== null);
  if (curDurations.length < MIN_SAMPLE || prevDurations.length < MIN_SAMPLE) {
    return null;
  }
  const curAvg = average(curDurations)!;
  const prevAvg = average(prevDurations)!;
  if (prevAvg === 0) return null;
  const deltaPct = Math.round(((curAvg - prevAvg) / prevAvg) * 100);
  if (Math.abs(deltaPct) < MIN_PCT_CHANGE) return null;

  const direction = deltaPct < 0 ? "dropped" : "rose";
  return {
    id: "completion-time",
    severity: deltaPct < 0 ? "positive" : "info",
    text: `Average completion time ${direction} ${Math.abs(
      deltaPct,
    )}% this period (now ${Math.round(curAvg / 60)} min).`,
  };
}

function completionRateInsight(
  current: DerivedRow[],
  previous: DerivedRow[],
): Insight | null {
  if (current.length < MIN_SAMPLE || previous.length < MIN_SAMPLE) return null;
  const curRate = percentage(
    current.filter((r) => r.completedAt !== null).length,
    current.length,
  );
  const prevRate = percentage(
    previous.filter((r) => r.completedAt !== null).length,
    previous.length,
  );
  if (curRate === null || prevRate === null) return null;
  const delta = Math.round(curRate - prevRate);
  if (Math.abs(delta) < MIN_POINT_CHANGE) return null;

  const direction = delta > 0 ? "improved" : "fell";
  return {
    id: "completion-rate",
    severity: delta > 0 ? "positive" : "warning",
    text: `Completion rate ${direction} ${Math.abs(delta)} points this period.`,
  };
}

function topCountryInsight(
  current: DerivedRow[],
  previous: DerivedRow[],
): Insight | null {
  const curKnown = current.filter((r) => r.country);
  if (curKnown.length < MIN_SAMPLE) return null;
  const curTop = tally(curKnown, (r) => r.country!)[0];
  if (!curTop || curTop.pct < 30) return null;

  const prevKnown = previous.filter((r) => r.country);
  const prevTop = prevKnown.length >= MIN_SAMPLE ? tally(prevKnown, (r) => r.country!)[0] : null;

  if (prevTop && prevTop.key === curTop.key) return null;

  return {
    id: "top-country",
    severity: "info",
    text: prevTop
      ? `${curTop.label} became the largest audience, overtaking ${prevTop.label}.`
      : `${curTop.label} is your largest audience (${curTop.pct}% of respondents).`,
  };
}

function consentRateInsight(
  current: DerivedRow[],
  previous: DerivedRow[],
): Insight | null {
  const curConsent = current.filter((r) => r.consentResearch !== null);
  const prevConsent = previous.filter((r) => r.consentResearch !== null);
  if (curConsent.length < MIN_SAMPLE || prevConsent.length < MIN_SAMPLE) {
    return null;
  }
  const curRate = percentage(
    curConsent.filter((r) => r.consentResearch === true).length,
    curConsent.length,
  );
  const prevRate = percentage(
    prevConsent.filter((r) => r.consentResearch === true).length,
    prevConsent.length,
  );
  if (curRate === null || prevRate === null) return null;
  const delta = Math.round(curRate - prevRate);
  if (Math.abs(delta) < MIN_POINT_CHANGE) return null;

  return {
    id: "consent-rate",
    severity: delta > 0 ? "positive" : "warning",
    text: `Research consent rate ${delta > 0 ? "increased" : "decreased"} ${Math.abs(delta)} points this period.`,
  };
}

function retakeRateInsight(
  current: DerivedRow[],
  previous: DerivedRow[],
): Insight | null {
  if (current.length < MIN_SAMPLE || previous.length < MIN_SAMPLE) return null;
  const curRate = retakeRatePct(current.map((r) => r.identityKey));
  const prevRate = retakeRatePct(previous.map((r) => r.identityKey));
  if (curRate === null || prevRate === null) return null;
  const delta = Math.round(curRate - prevRate);
  if (Math.abs(delta) < MIN_POINT_CHANGE) return null;

  return {
    id: "retake-rate",
    severity: "info",
    text: `Retake rate ${delta > 0 ? "rose" : "fell"} ${Math.abs(delta)} points this period.`,
  };
}

function qualityScoreInsight(
  current: DerivedRow[],
  previous: DerivedRow[],
): Insight | null {
  if (current.length < MIN_SAMPLE || previous.length < MIN_SAMPLE) return null;
  const curScore = qualityScorePct(dataQuality(current));
  const prevScore = qualityScorePct(dataQuality(previous));
  if (curScore === null || prevScore === null) return null;
  const delta = Math.round(curScore - prevScore);
  if (Math.abs(delta) < MIN_POINT_CHANGE) return null;

  return {
    id: "quality-score",
    severity: delta > 0 ? "positive" : "warning",
    text: `Data quality score ${delta > 0 ? "improved" : "declined"} ${Math.abs(delta)} points this period.`,
  };
}

/**
 * Heuristic: among current incomplete assessments, where do most people
 * stop? Uses `answeredCount` (questions answered before leaving) as a proxy
 * for position, since the consumer flow presents questions in order — not
 * an exact per-question event log, but a real, defensible signal.
 */
function abandonmentHotspotInsight(current: DerivedRow[]): Insight | null {
  const incomplete = current.filter((r) => r.completedAt === null);
  if (incomplete.length < MIN_ABANDON_SAMPLE) return null;

  const mode = tally(incomplete, (r) => String(r.answeredCount))[0];
  if (!mode || mode.count < MIN_ABANDON_SAMPLE) return null;

  const stoppedAt = Number(mode.key);
  return {
    id: "abandonment-hotspot",
    severity: "warning",
    text: `Most unfinished attempts stop after question ${stoppedAt} (${mode.count} of ${incomplete.length} incomplete attempts).`,
  };
}

export function generateInsights(
  current: DerivedRow[],
  previous: DerivedRow[],
): Insight[] {
  return [
    clusterMoverInsight(current, previous),
    completionTimeInsight(current, previous),
    completionRateInsight(current, previous),
    topCountryInsight(current, previous),
    consentRateInsight(current, previous),
    retakeRateInsight(current, previous),
    qualityScoreInsight(current, previous),
    abandonmentHotspotInsight(current),
  ].filter((insight): insight is Insight => insight !== null);
}
