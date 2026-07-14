import type { StringKey } from "@/lib/i18n/strings";
import type { ArchetypeName, ConfidenceLabel, DriverCode } from "@/lib/scoring/types";
import type { EcosystemFitName } from "@/lib/results/types";

/**
 * Display-name lookups for the small, fixed enum vocabularies the
 * deterministic scoring engine produces (confidence tier, archetype,
 * ecosystem fit, reward driver). The enum values themselves stay
 * English everywhere in `lib/scoring`/`lib/results` — they're used as
 * object keys and comparisons throughout that layer — these functions
 * only resolve the StringKey for *displaying* them to the user.
 */

const CONFIDENCE_LABEL_KEYS: Record<ConfidenceLabel, StringKey> = {
  High: "report.confidence.high",
  Moderate: "report.confidence.moderate",
  Low: "report.confidence.low",
};

export function getConfidenceLabelKey(label: ConfidenceLabel): StringKey {
  return CONFIDENCE_LABEL_KEYS[label];
}

const ARCHETYPE_KEYS: Record<ArchetypeName, StringKey> = {
  Precisionist: "report.archetype.precisionist",
  Coordinator: "report.archetype.coordinator",
  Explorer: "report.archetype.explorer",
  Catalyst: "report.archetype.catalyst",
  Adaptive: "report.archetype.adaptive",
};

export function getArchetypeKey(archetype: ArchetypeName): StringKey {
  return ARCHETYPE_KEYS[archetype];
}

const ECOSYSTEM_FIT_KEYS: Record<EcosystemFitName, StringKey> = {
  "High-Energy Team Player": "report.ecosystem.high_energy_team",
  "Structured Team Player": "report.ecosystem.structured_team",
  "Solo Sprinter": "report.ecosystem.solo_sprinter",
  "Solo Specialist": "report.ecosystem.solo_specialist",
};

export function getEcosystemFitKey(fit: EcosystemFitName): StringKey {
  return ECOSYSTEM_FIT_KEYS[fit];
}

const DRIVER_KEYS: Record<DriverCode, StringKey> = {
  REC: "report.driver.recognition",
  IMP: "report.driver.impact",
  AUT: "report.driver.autonomy",
  MAS: "report.driver.mastery",
  STA: "report.driver.stability",
};

export function getDriverKey(code: DriverCode): StringKey {
  return DRIVER_KEYS[code];
}
