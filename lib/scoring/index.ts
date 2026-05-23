import {
  type ArchetypeName,
  type ClusterCode,
  type CompassResult,
  type ConfidenceLabel,
  type DriverCode,
  type EcosystemFitName,
  type Question,
  type QuestionOption,
  clusterCodes,
  driverCodes,
} from "./types";

const archetypeDescs: Record<ArchetypeName, string> = {
  Precisionist:
    "Structured &amp; deep — you go all-in on a craft and master it with discipline.",
  Coordinator:
    "Structured &amp; broad — you orchestrate multiple workstreams and keep complexity calm.",
  Explorer:
    "Flexible &amp; deep — you wander into one domain at a time and obsess until you crack it.",
  Catalyst:
    "Flexible &amp; broad — you connect dots fast across many domains and create momentum.",
  Adaptive:
    "Balanced across structure, flexibility, depth, and breadth — context changes how you work.",
};

const driverNames: Record<DriverCode, string> = {
  REC: "Recognition",
  IMP: "Impact",
  AUT: "Autonomy",
  MAS: "Mastery",
  STA: "Stability",
};

function createScoreRecord<TCode extends string>(
  codes: readonly TCode[],
): Record<TCode, number> {
  return Object.fromEntries(codes.map((code) => [code, 0])) as Record<
    TCode,
    number
  >;
}

function rankScores<TCode extends string>(
  scores: Record<TCode, number>,
  order: readonly TCode[],
) {
  return [...order]
    .map((code) => [code, scores[code]] satisfies [TCode, number])
    .sort((a, b) => b[1] - a[1]);
}

function createZeroClusterRecord() {
  return createScoreRecord(clusterCodes);
}

function resolveOption(
  question: Question,
  rawAnswer: string | undefined,
): QuestionOption | undefined {
  if (rawAnswer === undefined || rawAnswer === "") return undefined;

  const byLetter = question.options.find(
    (option) => option.letter.toUpperCase() === rawAnswer.toUpperCase(),
  );
  if (byLetter) return byLetter;

  const asIndex = Number(rawAnswer);
  if (Number.isInteger(asIndex)) {
    return question.options[asIndex] ?? question.options[asIndex - 1];
  }

  return undefined;
}

function resolveAnswerAxisValue(
  questions: Question[],
  externalId: string,
  answers: Record<string, string>,
) {
  const question = questions.find((entry) => entry.externalId === externalId);
  if (!question) return undefined;
  return resolveOption(question, answers[externalId])?.axisValue;
}

function resolveProcessingStyle(
  struct: number,
  flex: number,
  questions: Question[],
  answers: Record<string, string>,
): "STRUCT" | "FLEX" | null {
  if (struct > flex) return "STRUCT";
  if (flex > struct) return "FLEX";

  const tieBreaker = resolveAnswerAxisValue(questions, "Q18", answers);
  if (tieBreaker === "STRUCT" || tieBreaker === "FLEX") return tieBreaker;
  return null;
}

function resolveScopeStyle(
  deep: number,
  broad: number,
  questions: Question[],
  answers: Record<string, string>,
): "DEEP" | "BROAD" | null {
  if (deep > broad) return "DEEP";
  if (broad > deep) return "BROAD";

  const tieBreaker = resolveAnswerAxisValue(questions, "Q21", answers);
  if (tieBreaker === "DEEP" || tieBreaker === "BROAD") return tieBreaker;
  return null;
}

function resolveArchetype(
  processing: "STRUCT" | "FLEX" | null,
  scope: "DEEP" | "BROAD" | null,
): ArchetypeName {
  if (processing === "STRUCT" && scope === "DEEP") return "Precisionist";
  if (processing === "STRUCT" && scope === "BROAD") return "Coordinator";
  if (processing === "FLEX" && scope === "DEEP") return "Explorer";
  if (processing === "FLEX" && scope === "BROAD") return "Catalyst";
  return "Adaptive";
}

function resolveEcosystemFit(
  collaborative: number,
  independent: number,
  dynamic: number,
  predictable: number,
  questions: Question[],
  answers: Record<string, string>,
): {
  fit: EcosystemFitName;
  social: "COL" | "IND";
  pulse: "DYN" | "PRE";
} {
  let social: "COL" | "IND";
  if (collaborative > independent) social = "COL";
  else if (independent > collaborative) social = "IND";
  else {
    social =
      resolveAnswerAxisValue(questions, "Q36", answers) === "IND"
        ? "IND"
        : "COL";
  }

  let pulse: "DYN" | "PRE";
  if (dynamic > predictable) pulse = "DYN";
  else if (predictable > dynamic) pulse = "PRE";
  else {
    pulse =
      resolveAnswerAxisValue(questions, "Q38", answers) === "PRE"
        ? "PRE"
        : "DYN";
  }

  if (social === "COL" && pulse === "DYN") {
    return { fit: "High-Energy Team Player", social, pulse };
  }
  if (social === "COL" && pulse === "PRE") {
    return { fit: "Structured Team Player", social, pulse };
  }
  if (social === "IND" && pulse === "DYN") {
    return { fit: "Solo Sprinter", social, pulse };
  }
  return { fit: "Solo Specialist", social, pulse };
}

const archetypeBonuses: Record<ArchetypeName, ClusterCode[]> = {
  Precisionist: ["SCI", "ENG"],
  Coordinator: ["BUS", "LAW"],
  Explorer: ["TECH", "ENV"],
  Catalyst: ["ART", "PPL"],
  Adaptive: [],
};

const ecosystemBonuses: Record<EcosystemFitName, ClusterCode[]> = {
  "High-Energy Team Player": ["BUS", "PPL"],
  "Structured Team Player": ["LAW", "ENG"],
  "Solo Sprinter": ["TECH", "ART"],
  "Solo Specialist": ["SCI", "ENV"],
};

function applyClusterBonuses(
  rawCluster: Record<ClusterCode, number>,
  archetype: ArchetypeName,
  ecosystemFit: EcosystemFitName,
) {
  const bonus = createZeroClusterRecord();
  const final = { ...rawCluster };

  for (const code of archetypeBonuses[archetype]) {
    bonus[code] += 0.5;
    final[code] += 0.5;
  }

  for (const code of ecosystemBonuses[ecosystemFit]) {
    bonus[code] += 0.5;
    final[code] += 0.5;
  }

  return { bonus, final };
}

function rankFinalClusters(
  finalScores: Record<ClusterCode, number>,
  rawScores: Record<ClusterCode, number>,
) {
  return [...clusterCodes]
    .map((code) => [code, finalScores[code]] satisfies [ClusterCode, number])
    .sort((a, b) => {
      const finalDiff = b[1] - a[1];
      if (finalDiff !== 0) return finalDiff;
      const rawDiff = rawScores[b[0]] - rawScores[a[0]];
      if (rawDiff !== 0) return rawDiff;
      return clusterCodes.indexOf(a[0]) - clusterCodes.indexOf(b[0]);
    });
}

function confidenceLabel(percentage: number): ConfidenceLabel {
  if (percentage >= 40) return "High";
  if (percentage >= 25) return "Moderate";
  return "Low";
}

function resolveDriverGroups(driverRanked: [DriverCode, number][]) {
  const topScore = driverRanked[0]?.[1] ?? 0;
  const primaryDrivers =
    topScore <= 1
      ? []
      : driverRanked
          .filter(([, score]) => score === topScore)
          .map(([code]) => code);

  if (primaryDrivers.length === 0) {
    return {
      primaryDrivers: [] as DriverCode[],
      secondaryDrivers: [] as DriverCode[],
      motivationLabel: "Balanced",
    };
  }

  const secondaryScore = driverRanked.find(([, score]) => score < topScore)?.[1];
  const secondaryDrivers =
    secondaryScore == null
      ? []
      : driverRanked
          .filter(([, score]) => score === secondaryScore && score > 0)
          .map(([code]) => code);

  return {
    primaryDrivers,
    secondaryDrivers,
    motivationLabel: primaryDrivers.join(", "),
  };
}

export function computeScore(
  answers: Record<string, string>,
  questions: Question[],
): CompassResult {
  const cluster = createScoreRecord(clusterCodes);

  for (const question of questions) {
    if (question.pillar !== 1) continue;

    const option = resolveOption(question, answers[question.externalId]);
    if (option?.clusterCode) {
      cluster[option.clusterCode] += 1;
    }
  }

  const clusterRankedRaw = rankScores(cluster, clusterCodes);

  let struct = 0;
  let flex = 0;
  let deep = 0;
  let broad = 0;

  for (const question of questions) {
    if (question.pillar !== 2) continue;

    const option = resolveOption(question, answers[question.externalId]);
    if (option?.axisValue === "STRUCT") struct += 1;
    if (option?.axisValue === "FLEX") flex += 1;
    if (option?.axisValue === "DEEP") deep += 1;
    if (option?.axisValue === "BROAD") broad += 1;
  }

  const proc = resolveProcessingStyle(struct, flex, questions, answers);
  const scope = resolveScopeStyle(deep, broad, questions, answers);
  const archetype = resolveArchetype(proc, scope);

  const driver = createScoreRecord(driverCodes);

  for (const question of questions) {
    if (question.pillar !== 3) continue;

    const option = resolveOption(question, answers[question.externalId]);
    if (option?.driverCode) {
      driver[option.driverCode] += 1;
    }
  }

  const driverRanked = rankScores(driver, driverCodes);
  const { primaryDrivers, secondaryDrivers, motivationLabel } =
    resolveDriverGroups(driverRanked);

  let col = 0;
  let ind = 0;
  let dyn = 0;
  let pre = 0;

  for (const question of questions) {
    if (question.pillar !== 4) continue;

    const option = resolveOption(question, answers[question.externalId]);
    if (option?.axisValue === "COL") col += 1;
    if (option?.axisValue === "IND") ind += 1;
    if (option?.axisValue === "DYN") dyn += 1;
    if (option?.axisValue === "PRE") pre += 1;
  }

  const ecosystem = resolveEcosystemFit(
    col,
    ind,
    dyn,
    pre,
    questions,
    answers,
  );
  const socialPos = 50 + ((ind - col) / 3) * 35;
  const envPos = 50 + ((pre - dyn) / 3) * 35;
  const procPos = 50 + ((flex - struct) / 4) * 30;
  const scopePos = 50 + ((broad - deep) / 4) * 30;
  const { bonus: clusterBonus, final: clusterFinal } = applyClusterBonuses(
    cluster,
    archetype,
    ecosystem.fit,
  );
  const clusterRanked = rankFinalClusters(clusterFinal, cluster);
  const topCluster = clusterRanked[0][0];
  const primaryClusterScore = clusterFinal[topCluster];
  const confidencePercentage = Math.round((primaryClusterScore / 16) * 100);
  const multiCuriousClusters = clusterRanked
    .filter(([, score]) => primaryClusterScore - score <= 1)
    .slice(0, 3)
    .map(([code]) => code);
  const isMultiCurious = multiCuriousClusters.length >= 3;

  return {
    cluster,
    clusterRaw: { ...cluster },
    clusterBonus,
    clusterFinal,
    clusterRankedRaw,
    clusterRanked,
    topCluster,
    primaryClusterScore,
    confidencePercentage,
    confidenceLabel: confidenceLabel(confidencePercentage),
    isMultiCurious,
    multiCuriousClusters: isMultiCurious ? multiCuriousClusters : [],
    archetype,
    archetypeDesc: archetypeDescs[archetype],
    driver,
    driverRanked,
    primaryDriver: primaryDrivers[0] ?? driverRanked[0][0],
    secondaryDriver:
      secondaryDrivers[0] ?? driverRanked.find(([code]) => code !== driverRanked[0][0])![0],
    primaryDrivers,
    secondaryDrivers,
    motivationLabel,
    driverNames,
    ecosystemFit: ecosystem.fit,
    socialPos,
    envPos,
    procPos,
    scopePos,
    axes: {
      processing: proc ?? "STRUCT",
      scope: scope ?? "DEEP",
      social: {
        collaborative: col,
        independent: ind,
      },
      environment: {
        dynamic: dyn,
        predictable: pre,
      },
    },
  };
}

export type {
  ArchetypeName,
  CompassResult,
  DriverCode,
  Question,
} from "./types";

export type { ClusterCode } from "./types";
