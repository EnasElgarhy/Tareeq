import { DEFAULT_LOCALE, getStoredLocale, isRtl } from "@/lib/i18n/locale";
import { buildFallbackReport } from "@/lib/results/framework";
import type {
  PlatformConsent,
  PersonalizedCompassReport,
  ResultConsent,
  ResultRegistration,
} from "@/lib/results/types";

export const resultRegistrationStorageKey = "tareeq.result.registration.v1";
export const generatedReportStorageKey = "tareeq.result.report.v1";
export const platformConsentStorageKey = "tareeq.platform.consent.v1";

const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

/**
 * A fallback report's prose is derived from its `CompassResult` (stored as
 * `report.score`), so when the visitor switches language after generating,
 * the stored text can be re-rendered in the language they are reading in now
 * — otherwise an English report shown in the Arabic shell leaves career
 * names, majors, paragraphs and even mid-sentence interpolations in English.
 *
 * Model-written reports (source `claude`/`gemini`) hold text we cannot
 * re-derive offline, so they are returned untouched.
 */
function inVisitorLanguage(
  report: PersonalizedCompassReport,
): PersonalizedCompassReport {
  if (report.source !== "fallback") return report;

  const locale = getStoredLocale() ?? DEFAULT_LOCALE;
  // clusterName is written from the same locale table as the rest of the
  // prose, so its script tells us which language the stored text is in —
  // including for reports saved before this rule existed.
  const contentIsArabic = ARABIC_SCRIPT.test(report.clusterName);
  if (contentIsArabic === isRtl(locale)) return report;

  return {
    ...buildFallbackReport({
      result: report.score,
      name: readResultRegistration()?.name,
      locale,
      source: report.source,
      model: report.model,
      // Keep the note written at generation time; it explains the original
      // fallback rather than this re-rendering.
      fallbackReason: report.fallbackReason,
    }),
    generatedAt: report.generatedAt,
  };
}

export function createEmptyResultConsent(
  ageGate: ResultConsent["ageGate"] = "unknown",
  recordedAt = new Date().toISOString(),
): ResultConsent {
  return {
    generalResearch: false,
    longitudinalFollowup: false,
    universitySharing: false,
    ageGate,
    recordedAt,
    consentVersion: "v1",
    language: "en",
  };
}

function isResultConsent(value: unknown): value is ResultConsent {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ResultConsent>;

  return (
    typeof candidate.generalResearch === "boolean" &&
    typeof candidate.longitudinalFollowup === "boolean" &&
    typeof candidate.universitySharing === "boolean" &&
    (candidate.ageGate === "adult" ||
      candidate.ageGate === "minor" ||
      candidate.ageGate === "unknown") &&
    typeof candidate.recordedAt === "string" &&
    candidate.consentVersion === "v1" &&
    candidate.language === "en"
  );
}

export function readPlatformConsent() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(platformConsentStorageKey);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as PlatformConsent).acceptedAt === "string" &&
      (parsed as PlatformConsent).consentVersion === "v1" &&
      (parsed as PlatformConsent).language === "en"
    ) {
      return parsed as PlatformConsent;
    }
  } catch {
    return null;
  }

  return null;
}

export function writePlatformConsent(
  consent: PlatformConsent = {
    acceptedAt: new Date().toISOString(),
    consentVersion: "v1",
    language: "en",
  },
) {
  if (typeof window === "undefined") return consent;
  window.localStorage.setItem(
    platformConsentStorageKey,
    JSON.stringify(consent),
  );
  return consent;
}

export function readResultRegistration() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(resultRegistrationStorageKey);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as ResultRegistration).name === "string" &&
      typeof (parsed as ResultRegistration).email === "string" &&
      typeof (parsed as ResultRegistration).verifiedAt === "string"
    ) {
      const candidate = parsed as Partial<ResultRegistration>;
      return {
        name: candidate.name,
        email: candidate.email,
        verifiedAt: candidate.verifiedAt,
        consent: isResultConsent(candidate.consent)
          ? candidate.consent
          : createEmptyResultConsent(),
        ...(typeof candidate.assessmentId === "string"
          ? { assessmentId: candidate.assessmentId }
          : {}),
      } as ResultRegistration;
    }
  } catch {
    return null;
  }

  return null;
}

export function writeResultRegistration(registration: ResultRegistration) {
  if (typeof window === "undefined") return registration;
  window.localStorage.setItem(
    resultRegistrationStorageKey,
    JSON.stringify(registration),
  );
  return registration;
}

export function readGeneratedReport() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(generatedReportStorageKey);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as PersonalizedCompassReport).headline === "string" &&
      typeof (parsed as PersonalizedCompassReport).clusterName === "string"
    ) {
      return inVisitorLanguage(parsed as PersonalizedCompassReport);
    }
  } catch {
    return null;
  }

  return null;
}

export function writeGeneratedReport(report: PersonalizedCompassReport) {
  if (typeof window === "undefined") return report;
  window.localStorage.setItem(
    generatedReportStorageKey,
    JSON.stringify(report),
  );
  return report;
}

export function clearResultStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(resultRegistrationStorageKey);
  window.localStorage.removeItem(generatedReportStorageKey);
}
