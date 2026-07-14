import { percentage, qualityScorePct } from "@/lib/admin/analytics/aggregate";
import type { Alert, DerivedRow } from "@/lib/admin/analytics/types";

/**
 * Deterministic "needs attention" rules over the current period. Each only
 * fires above a minimum sample size, so a near-empty dataset doesn't trip
 * every threshold. Intentionally does NOT include AI-extraction or import
 * failure alerts — no event log exists for either today (see
 * ANALYTICS_PHASE_1_SUMMARY.md); fabricating them would be worse than
 * omitting them.
 */

const MIN_SAMPLE = 5;
const ABANDONMENT_WARN_PCT = 70;
const ABANDONMENT_CRITICAL_PCT = 50;
const MISSING_DEMOGRAPHICS_PCT = 70;
const LOW_CONSENT_PCT = 30;
const LOW_QUALITY_PCT = 80;
const CRITICAL_QUALITY_PCT = 60;

function highAbandonmentAlert(rows: DerivedRow[]): Alert | null {
  if (rows.length < MIN_SAMPLE) return null;
  const rate = percentage(
    rows.filter((r) => r.completedAt !== null).length,
    rows.length,
  );
  if (rate === null || rate >= ABANDONMENT_WARN_PCT) return null;
  return {
    id: "high-abandonment",
    severity: rate < ABANDONMENT_CRITICAL_PCT ? "critical" : "warning",
    text: `Only ${rate}% of started assessments are being completed.`,
  };
}

function missingDemographicsAlert(rows: DerivedRow[]): Alert | null {
  if (rows.length < MIN_SAMPLE) return null;
  const missingCountry = percentage(
    rows.filter((r) => !r.country).length,
    rows.length,
  )!;
  const missingGender = percentage(
    rows.filter((r) => !r.gender).length,
    rows.length,
  )!;
  const worst = Math.max(missingCountry, missingGender);
  if (worst < MISSING_DEMOGRAPHICS_PCT) return null;
  return {
    id: "missing-demographics",
    severity: "warning",
    text: `Demographic data is mostly missing — ${Math.round(worst)}% of respondents have no country or gender on file.`,
  };
}

function lowConsentAlert(rows: DerivedRow[]): Alert | null {
  const consentRows = rows.filter((r) => r.consentResearch !== null);
  if (consentRows.length < MIN_SAMPLE) return null;
  const rate = percentage(
    consentRows.filter((r) => r.consentResearch === true).length,
    consentRows.length,
  );
  if (rate === null || rate >= LOW_CONSENT_PCT) return null;
  return {
    id: "low-consent",
    severity: "warning",
    text: `Research consent is low — only ${rate}% of respondents asked have opted in.`,
  };
}

function lowQualityAlert(rows: DerivedRow[]): Alert | null {
  if (rows.length < MIN_SAMPLE) return null;
  const suspicious = rows.filter((r) => r.isFlagged).length;
  const score = qualityScorePct({
    rushedCount: 0,
    veryLongCount: 0,
    allSameAnswerCount: 0,
    missingAnswersCount: 0,
    suspiciousCount: suspicious,
    cleanCount: rows.length - suspicious,
    totalCount: rows.length,
  });
  if (score === null || score >= LOW_QUALITY_PCT) return null;
  return {
    id: "low-quality",
    severity: score < CRITICAL_QUALITY_PCT ? "critical" : "warning",
    text: `Data quality score is ${score}% — ${suspicious} record${suspicious === 1 ? "" : "s"} flagged for review.`,
  };
}

export function generateAlerts(rows: DerivedRow[]): Alert[] {
  return [
    highAbandonmentAlert(rows),
    missingDemographicsAlert(rows),
    lowConsentAlert(rows),
    lowQualityAlert(rows),
  ].filter((a): a is Alert => a !== null);
}
