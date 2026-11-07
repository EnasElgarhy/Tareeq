import { DEMO_FALLBACK_LABELS } from "@/lib/admin/analytics/demographics";
import {
  CORE_QUESTION_SET,
  type DecodedCoreAnswer,
} from "@/lib/admin/core/framework";

/**
 * The "About you" answers, readable in the admin. Attempts from 6 Nov 2026
 * store option IDs (AGE-16-17, QD3-B); older CORE attempts store the letter
 * of a question set 5.2 option. QD3's IDs and letters mean different options,
 * so the two never share a label.
 */
const AGE_LABELS: Record<string, string> = {
  A: "Under 16",
  B: "16–17",
  C: "18–19",
  D: "20–21",
  E: "22 or older",
  "AGE-U13": "Under 13",
  "AGE-13-15": "13–15",
  "AGE-16-17": "16–17",
  "AGE-18-19": "18–19",
  "AGE-20-21": "20–21",
  "AGE-22P": "22 or older",
};

const LETTERS = "ABCDEFGH";

/** Question set 5.2's options by letter, for attempts saved before 6 Nov. */
function lettersOf(questionId: string): Record<string, string> {
  const question = CORE_QUESTION_SET.background_questions.find(
    (q) => q.question_id === questionId,
  );
  return Object.fromEntries(
    (question?.options ?? []).map((o, i) => [LETTERS[i], o.text_en]),
  );
}

const NEW_IDS = (questionId: "QD3" | "QD4") =>
  Object.fromEntries(
    Object.entries(DEMO_FALLBACK_LABELS[questionId]).filter(([key]) =>
      key.startsWith(`${questionId}-`),
    ),
  );

const CITIZEN_LABELS: Record<string, string> = {
  "QD2b-Y": "Yes",
  "QD2b-N": "No",
  "QD2b-X": "Prefer not to say",
};

const BACKGROUND: Record<
  string,
  { question: string; labels: Record<string, string> | null }
> = {
  QD1: { question: "Age", labels: AGE_LABELS },
  QD2: { question: "Country", labels: null },
  QD2b: {
    question: "Citizen of that country",
    labels: { ...lettersOf("QD2b"), ...CITIZEN_LABELS },
  },
  QD3: {
    question: "Stage of study",
    labels: { ...lettersOf("QD3"), ...NEW_IDS("QD3") },
  },
  QD4: {
    question: "Gender",
    labels: { ...lettersOf("QD4"), ...NEW_IDS("QD4") },
  },
};

export function describeBackgroundAnswer(
  key: string,
  value: string,
): { question: string; answer: string } | null {
  const entry = BACKGROUND[key];
  if (!entry) return null;
  return { question: entry.question, answer: entry.labels?.[value] ?? value };
}

/** Gives the decoded "About you" rows a readable question and answer. */
export function labelBackgroundAnswers(
  decoded: readonly DecodedCoreAnswer[],
): DecodedCoreAnswer[] {
  return decoded.map((row) => {
    if (row.pillar !== null) return row;
    const described = describeBackgroundAnswer(row.itemId, row.letter);
    return described
      ? { ...row, stem: described.question, answerText: described.answer }
      : row;
  });
}
