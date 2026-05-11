import {
  type ArchetypeName,
  type CompassResult,
  type DriverCode,
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

  const clusterRanked = rankScores(cluster, clusterCodes);

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

  const proc = struct >= flex ? "STRUCT" : "FLEX";
  const scope = deep >= broad ? "DEEP" : "BROAD";
  const archetype: ArchetypeName =
    proc === "STRUCT" && scope === "DEEP"
      ? "Precisionist"
      : proc === "STRUCT" && scope === "BROAD"
        ? "Coordinator"
        : proc === "FLEX" && scope === "DEEP"
          ? "Explorer"
          : "Catalyst";

  const driver = createScoreRecord(driverCodes);

  for (const question of questions) {
    if (question.pillar !== 3) continue;

    const option = resolveOption(question, answers[question.externalId]);
    if (option?.driverCode) {
      driver[option.driverCode] += 1;
    }
  }

  const driverRanked = rankScores(driver, driverCodes);

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

  const socialPos = 50 + ((ind - col) / 3) * 35;
  const envPos = 50 + ((pre - dyn) / 3) * 35;
  const procPos = 50 + ((flex - struct) / 4) * 30;
  const scopePos = 50 + ((broad - deep) / 4) * 30;

  return {
    cluster,
    clusterRanked,
    topCluster: clusterRanked[0][0],
    archetype,
    archetypeDesc: archetypeDescs[archetype],
    driver,
    driverRanked,
    primaryDriver: driverRanked[0][0],
    secondaryDriver: driverRanked[1][0],
    driverNames,
    socialPos,
    envPos,
    procPos,
    scopePos,
    axes: {
      processing: proc,
      scope,
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
