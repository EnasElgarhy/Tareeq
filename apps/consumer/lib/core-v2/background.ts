import type { Question } from "@/lib/scoring/types";

/**
 * The four "About you" questions (corrections of 6 Nov 2026, section 5).
 * They come before the assessment, are never counted in it, and store option
 * IDs. QD3 changed from the question set, so every attempt records
 * QD3_VERSION to keep it apart from older answers.
 */

export const AGE_QUESTION_ID = "QD1";
export const AGE_UNDER_13 = "AGE-U13";
export const CITIZEN_QUESTION_ID = "QD2b";
export const QD3_VERSION = "QD3 v2";

const option = (letter: string, position: number, en: string, ar: string) => ({
  letter,
  position,
  text: { en, ar },
});

export const CORE_BACKGROUND_QUESTIONS: Question[] = [
  {
    externalId: AGE_QUESTION_ID,
    pillar: 0,
    position: 1,
    kind: "single",
    title: { en: "How old are you?", ar: "كم عمرك؟" },
    options: [
      option(AGE_UNDER_13, 1, "Under 13", "أقل من 13"),
      option("AGE-13-15", 2, "13–15", "13–15"),
      option("AGE-16-17", 3, "16–17", "16–17"),
      option("AGE-18-19", 4, "18–19", "18–19"),
      option("AGE-20-21", 5, "20–21", "20–21"),
      option("AGE-22P", 6, "22 or older", "22 فأكثر"),
    ],
  },
  {
    externalId: "QD2",
    pillar: 0,
    position: 2,
    kind: "select",
    title: { en: "Which country do you live in now?", ar: "بلد الإقامة الحالي" },
    options: [],
  },
  {
    externalId: "QD3",
    pillar: 0,
    position: 3,
    kind: "single",
    title: {
      en: "What grade or stage of study are you in now?",
      ar: "في أي صف أو مرحلة دراسية أنت الآن؟",
    },
    options: [
      option("QD3-A", 1, "Grade 7 or 8 (Year 8 or 9)", "الصف السابع أو الثامن (السنة الثامنة أو التاسعة في النظام البريطاني)"),
      option("QD3-B", 2, "Grade 9 or 10 (Year 10 or 11)", "الصف التاسع أو العاشر (السنة العاشرة أو الحادية عشرة في النظام البريطاني)"),
      option("QD3-C", 3, "Grade 11 or 12 (Year 12 or 13)", "الصف الحادي عشر أو الثاني عشر (السنة الثانية عشرة أو الثالثة عشرة في النظام البريطاني)"),
      option("QD3-D", 4, "Gap year, or between school and university", "سنة انتقالية بين المدرسة والجامعة"),
      option("QD3-E", 5, "College, diploma or vocational programme", "كلية أو دبلوم أو برنامج مهني"),
      option("QD3-F", 6, "University, year 1 or 2", "الجامعة: السنة الأولى أو الثانية"),
      option("QD3-G", 7, "University, year 3 or above", "الجامعة: السنة الثالثة فأكثر"),
      option("QD3-H", 8, "Not currently studying", "لا أدرس حاليًا"),
    ],
  },
  {
    externalId: "QD4",
    pillar: 0,
    position: 4,
    kind: "binary",
    title: {
      en: "Are you male or female? This helps us address you correctly in your report.",
      ar: "هل أنت ذكر أم أنثى؟ يساعدنا ذلك على مخاطبتك بالشكل الصحيح في تقريرك.",
    },
    options: [option("QD4-F", 1, "Female", "أنثى"), option("QD4-M", 2, "Male", "ذكر")],
  },
];

/** QD2b sits under the country list, on the same screen. */
export const CITIZEN_QUESTION = {
  title: { en: "Are you a citizen of the country you live in?", ar: "هل جنسيتك هي جنسية بلد إقامتك؟" },
  options: [
    option("QD2b-Y", 1, "Yes", "نعم"),
    option("QD2b-N", 2, "No", "لا"),
    option("QD2b-X", 3, "Prefer not to say", "أفضّل عدم الإجابة"),
  ],
} as const;

export type AgeGroup = "minor" | "adult" | "unknown";

/**
 * Under 18 or not (spec §10), from the age band. The letters are attempts
 * saved before the 6 Nov options (A and B were under 18).
 */
export function ageGroupOf(answer: string | undefined): AgeGroup {
  if (answer === "AGE-13-15" || answer === "AGE-16-17" || answer === "A" || answer === "B") return "minor";
  if (answer === "AGE-18-19" || answer === "AGE-20-21" || answer === "AGE-22P") return "adult";
  if (answer === "C" || answer === "D" || answer === "E") return "adult";
  return "unknown";
}
