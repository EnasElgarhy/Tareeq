export const clusterCodes = [
  "TECH",
  "ENG",
  "SCI",
  "ART",
  "BUS",
  "LAW",
  "PPL",
  "ENV",
] as const;

export const driverCodes = ["REC", "IMP", "AUT", "MAS", "STA"] as const;

export type ClusterCode = (typeof clusterCodes)[number];
export type DriverCode = (typeof driverCodes)[number];

export type ArchetypeName =
  | "Precisionist"
  | "Coordinator"
  | "Explorer"
  | "Catalyst"
  | "Adaptive";

export type AxisCode = "PROC" | "SCOPE" | "SOC" | "ENV";

export type AxisValue =
  | "STRUCT"
  | "FLEX"
  | "DEEP"
  | "BROAD"
  | "COL"
  | "IND"
  | "DYN"
  | "PRE";

export type QuestionKind = "single" | "binary" | "select" | "text";

export type LocalizedText = Record<string, string>;

export type QuestionOption = {
  letter: string;
  position: number;
  text: LocalizedText;
  clusterCode?: ClusterCode;
  driverCode?: DriverCode;
  axisValue?: AxisValue;
  /**
   * Custom-assessment scoring category (open string, e.g. "LEAD"). Set on
   * Custom-assessment options; backed by `question_options.category_code`. The
   * Custom executor reads `categoryCode ?? clusterCode`, keeping CORE (which
   * uses `clusterCode`) untouched. Validated app-side against the assessment's
   * `assessment_categories`.
   */
  categoryCode?: string;
  /**
   * Points this option contributes to its category/cluster when selected.
   * Defaults to 1 when absent (preserving Core-engine behaviour, which counts
   * each pick as one). Backed by the `question_options.weight` column.
   */
  weight?: number;
};

export type Question = {
  externalId: string;
  pillar: 0 | 1 | 2 | 3 | 4;
  position: number;
  kind: QuestionKind;
  title: LocalizedText;
  axis?: AxisCode;
  options: QuestionOption[];
};

export type RankedScore<TCode extends string> = [TCode, number];

export type ConfidenceLabel = "High" | "Moderate" | "Low";

export type EcosystemFitName =
  | "High-Energy Team Player"
  | "Structured Team Player"
  | "Solo Sprinter"
  | "Solo Specialist";

export type CompassResult = {
  /** Raw Pillar 1 curiosity scores before modifiers. */
  cluster: Record<ClusterCode, number>;
  clusterRaw: Record<ClusterCode, number>;
  clusterBonus: Record<ClusterCode, number>;
  clusterFinal: Record<ClusterCode, number>;
  clusterRankedRaw: RankedScore<ClusterCode>[];
  /** Final cluster ranking after operational/ecosystem modifiers. */
  clusterRanked: RankedScore<ClusterCode>[];
  topCluster: ClusterCode;
  primaryClusterScore: number;
  confidencePercentage: number;
  confidenceLabel: ConfidenceLabel;
  isMultiCurious: boolean;
  multiCuriousClusters: ClusterCode[];
  archetype: ArchetypeName;
  archetypeDesc: string;
  driver: Record<DriverCode, number>;
  driverRanked: RankedScore<DriverCode>[];
  primaryDriver: DriverCode;
  secondaryDriver: DriverCode;
  primaryDrivers: DriverCode[];
  secondaryDrivers: DriverCode[];
  motivationLabel: string;
  driverNames: Record<DriverCode, string>;
  ecosystemFit: EcosystemFitName;
  socialPos: number;
  envPos: number;
  procPos: number;
  scopePos: number;
  axes: {
    processing: "STRUCT" | "FLEX";
    scope: "DEEP" | "BROAD";
    social: {
      collaborative: number;
      independent: number;
    };
    environment: {
      dynamic: number;
      predictable: number;
    };
  };
};
