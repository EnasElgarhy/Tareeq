import type { Locale } from "@/lib/i18n/locale";
import type { StringKey } from "@/lib/i18n/strings";

export interface StoryStep {
  title: StringKey;
  body: StringKey;
  /** A short line under the body (steps 2 and 4). */
  note?: StringKey;
}

/** The four report steps (28 Oct update, Part B "Report steps"). */
export const STORY_STEPS: readonly StoryStep[] = [
  { title: "marketing.card1.headline", body: "marketing.card1.body" },
  { title: "marketing.card2.headline", body: "marketing.card2.body", note: "marketing.card2.note" },
  { title: "marketing.card3.headline", body: "marketing.card3.body" },
  { title: "marketing.card4.headline", body: "marketing.card4.body", note: "marketing.card4.note" },
];

export const STEP_COUNT = STORY_STEPS.length;

/**
 * Captures of the real example report (sections 2, 3 and 4 at 390 px,
 * cropped to the content), one per locale. Heights are the files' pixel
 * heights at 600 px wide, so the phone knows how far it can scroll each one.
 */
export const REPORT_SHOTS: Record<Locale, readonly { src: string; height: number }[]> = {
  en: [
    { src: "/marketing/report-story/en-S2.jpg", height: 2800 },
    { src: "/marketing/report-story/en-S3.jpg", height: 2800 },
    { src: "/marketing/report-story/en-S4.jpg", height: 2800 },
  ],
  ar: [
    { src: "/marketing/report-story/ar-S2.jpg", height: 2800 },
    { src: "/marketing/report-story/ar-S3.jpg", height: 2491 },
    { src: "/marketing/report-story/ar-S4.jpg", height: 2800 },
  ],
};
export const SHOT_WIDTH = 600;

/**
 * The example student (staging corrections v4, section A): Research &
 * Discovery with People & Wellbeing, meeting in Clinical and health sciences.
 * Genetic counsellor is the job in that family offering close teamwork,
 * making a difference and mastery (bank 1.1, F-RD-PW-J3); study fields
 * belong to the family, as in the real report.
 */
export const EXAMPLE = {
  job: { en: "Genetic counsellor", ar: "مستشار وراثي" },
  study: {
    en: ["Psychology", "Nutrition and dietetics", "Genetics", "Public health"],
    ar: ["علم النفس", "التغذية العلاجية", "علم الوراثة", "الصحة العامة"],
  },
  reply: {
    en: "Research & Discovery feels most like me.",
    ar: "«البحث والاكتشاف» هو الأقرب إليّ.",
  },
  followUp: {
    en: "Nice. When did you last go looking for the “why” of something?",
    ar: "جميل. متى بحثت آخر مرة عن «لماذا» شيءٍ ما؟",
  },
} as const;
