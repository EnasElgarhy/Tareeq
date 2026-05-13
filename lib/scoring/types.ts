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
  | "Catalyst";

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

export type CompassResult = {
  cluster: Record<ClusterCode, number>;
  clusterRanked: RankedScore<ClusterCode>[];
  topCluster: ClusterCode;
  archetype: ArchetypeName;
  archetypeDesc: string;
  driver: Record<DriverCode, number>;
  driverRanked: RankedScore<DriverCode>[];
  primaryDriver: DriverCode;
  secondaryDriver: DriverCode;
  driverNames: Record<DriverCode, string>;
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
