import type { ClusterCode, CompassResult } from "@/lib/scoring";

export type EcosystemFitName =
  | "High-Energy Team Player"
  | "Structured Team Player"
  | "Solo Sprinter"
  | "Solo Specialist";

export type ResultSource = "claude" | "fallback";

export interface PlatformConsent {
  acceptedAt: string;
  consentVersion: "v1";
  language: "en";
}

export type ConsentAgeGate = "adult" | "minor" | "unknown";

export interface ResultConsent {
  generalResearch: boolean;
  longitudinalFollowup: boolean;
  universitySharing: boolean;
  ageGate: ConsentAgeGate;
  recordedAt: string;
  consentVersion: "v1";
  language: "en";
}

export interface ResultRegistration {
  name: string;
  email: string;
  verifiedAt: string;
  consent: ResultConsent;
}

export interface PersonalizedCompassReport {
  generatedAt: string;
  source: ResultSource;
  model?: string;
  fallbackReason?: string;
  clusterCode: ClusterCode;
  clusterName: string;
  isMultiCurious: boolean;
  multiCuriousClusters: string[];
  archetype: CompassResult["archetype"];
  primaryDriver: string;
  secondaryDriver: string;
  ecosystemFit: EcosystemFitName;
  headline: string;
  summary: string;
  academicPath: string;
  careerLandscape: string;
  integration: string;
  realityCheck: string;
  nextSteps: string;
  highSchoolSubjects: string[];
  universityMajors: string[];
  careerExamples: string[];
  nonObviousPaths: string[];
  score: CompassResult;
}
