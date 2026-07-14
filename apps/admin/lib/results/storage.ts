import type {
  PlatformConsent,
  PersonalizedCompassReport,
  ResultConsent,
  ResultRegistration,
} from "@/lib/results/types";

export const resultRegistrationStorageKey = "tareeq.result.registration.v1";
export const generatedReportStorageKey = "tareeq.result.report.v1";
export const platformConsentStorageKey = "tareeq.platform.consent.v1";

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
      return parsed as PersonalizedCompassReport;
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
