import type { CoreKaiAgeBand, CoreKaiGender, CoreStudentProfile } from "./core-context";

/**
 * STUDENT_PROFILE from the background questions the CORE flow asks first
 * (QD1 age, QD2 country, QD3 stage, QD4 gender). New attempts store option
 * IDs; the single letters are attempts saved before 6 Nov 2026.
 */

const AGE_BANDS: Record<string, CoreKaiAgeBand> = {
  A: "13-17", // Under 16
  B: "13-17", // 16 or 17
  C: "18+",
  D: "18+",
  E: "18+",
  "AGE-13-15": "13-17",
  "AGE-16-17": "13-17",
  "AGE-18-19": "18+",
  "AGE-20-21": "18+",
  "AGE-22P": "18+",
};

/** QD3 options, as the English labels Kai reads. */
const ACADEMIC_STAGES: Record<string, string> = {
  A: "Final two years of high school",
  B: "Gap year or transition",
  C: "University, year 1 or 2",
  D: "University, year 3 or above",
  E: "Not currently in formal education",
  "QD3-A": "Grade 7 or 8",
  "QD3-B": "Grade 9 or 10",
  "QD3-C": "Grade 11 or 12",
  "QD3-D": "Gap year or transition",
  "QD3-E": "College, diploma or vocational programme",
  "QD3-F": "University, year 1 or 2",
  "QD3-G": "University, year 3 or above",
  "QD3-H": "Not currently studying",
};

/** QD4: "Prefer not to say" (C) leaves gender unset. */
const GENDERS: Record<string, CoreKaiGender> = {
  A: "female",
  B: "male",
  "QD4-F": "female",
  "QD4-M": "male",
};

const MAX_COUNTRY = 80;

export function coreStudentProfile(answers: Readonly<Record<string, string>>): CoreStudentProfile {
  const country = answers.QD2?.trim().slice(0, MAX_COUNTRY);
  return {
    gender: GENDERS[answers.QD4 ?? ""] ?? null,
    ageBand: AGE_BANDS[answers.QD1 ?? ""] ?? null,
    academicStage: ACADEMIC_STAGES[answers.QD3 ?? ""] ?? null,
    country: country || null,
  };
}
