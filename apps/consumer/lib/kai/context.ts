import { getClusterProfile } from "@/lib/results/framework";
import type { PersonalizedCompassReport } from "@/lib/results/types";
import type { ProfileSnapshot } from "@/lib/profile/journey";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";
import type {
  KaiAssessmentContext,
  KaiContext,
  KaiJourneyContext,
  KaiReportContext,
} from "@/lib/kai/types";

/**
 * Builds the context Kai is allowed to reason from — a pure function over
 * already-loaded, already-user-facing data. Does not touch localStorage,
 * Supabase, or the network itself; the caller (a component/hook) supplies
 * whatever it already read, so this stays trivially testable.
 *
 * The rule this function exists to enforce (see CONSUMER_2_ARCHITECTURE.md
 * §4.2): Kai gets exactly what the user can already see on their own
 * Career Compass — a display name, the deterministic result's headline
 * facts, the narrative report's already-published recommendations, and a
 * journey summary. It never gets email, raw PII, the 54-question answer
 * digest, or any score the UI doesn't already surface (e.g. per-cluster
 * raw/bonus point totals — only the ranked *names* are exposed).
 *
 * No Gemini call happens here or anywhere yet in Phase 1 — this shape is
 * prepared ahead of that wiring, not sent anywhere.
 */
export function buildKaiContext(input: {
  displayName: string;
  locale: string;
  snapshot: ProfileSnapshot;
}): KaiContext {
  const { displayName, locale, snapshot } = input;
  const report = snapshot.coreReport;
  const resolvedLocale = isLocale(locale) ? locale : DEFAULT_LOCALE;

  const context: KaiContext = {
    user: {
      displayName: displayName.trim() || "there",
      locale,
    },
    assessment: buildAssessmentContext(report, resolvedLocale),
    report: buildReportContext(report),
    journey: buildJourneyContext(snapshot),
  };

  assertNoExcludedFields(context);
  return context;
}

function buildAssessmentContext(
  report: PersonalizedCompassReport | null,
  locale: Locale,
): KaiAssessmentContext | null {
  if (!report) return null;

  const topClusters = report.score.clusterRanked
    .slice(0, 3)
    .map(([code]) => getClusterProfile(code, locale).name);

  return {
    primaryCluster: report.clusterName,
    confidence: report.score.confidencePercentage,
    archetype: report.archetype,
    rewardDriver: report.primaryDriver,
    ecosystemFit: report.ecosystemFit,
    topClusters,
  };
}

function buildReportContext(
  report: PersonalizedCompassReport | null,
): KaiReportContext | null {
  if (!report) return null;

  return {
    headline: report.headline,
    summary: report.summary,
    recommendedMajors: report.universityMajors,
    recommendedCareers: report.careerExamples,
  };
}

function buildJourneyContext(snapshot: ProfileSnapshot): KaiJourneyContext {
  return {
    completedAssessments: snapshot.modules
      .filter((m) => m.status === "completed")
      .map((m) => m.name),
    lockedModules: snapshot.modules
      .filter((m) => m.status === "locked")
      .map((m) => m.name),
  };
}

/**
 * Excluded field names — the runtime backstop behind the TypeScript shape.
 * `KaiContext` structurally has nowhere to put these today, but a future
 * edit that spreads a wider object (e.g. `...snapshot.registration`)
 * straight into the context wouldn't be caught by types alone. Checked by
 * key name, recursively, so it catches an accidental leak wherever it'd
 * land in the tree.
 */
const EXCLUDED_FIELD_NAMES = [
  "email",
  "respondentEmail",
  "respondent_email",
  "ipCountry",
  "ip_country",
  "userAgent",
  "user_agent",
  "phone",
  "address",
  "answers",
] as const;

/** Exported primarily so its own behavior can be unit-tested directly. */
export function assertNoExcludedFields(value: unknown, path = "context"): void {
  if (value === null || typeof value !== "object") return;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if ((EXCLUDED_FIELD_NAMES as readonly string[]).includes(key)) {
      const message = `Kai context leaked an excluded field: ${path}.${key}`;
      if (process.env.NODE_ENV !== "production") {
        throw new Error(message);
      }
      // Production: never crash the Profile over this — but never silently
      // ship the field either. Strip it in place and move on.
      delete (value as Record<string, unknown>)[key];
      console.error(message);
      continue;
    }
    assertNoExcludedFields(nested, `${path}.${key}`);
  }
}
