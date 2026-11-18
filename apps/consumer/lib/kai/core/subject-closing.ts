import type { Locale } from "@/lib/i18n/locale";

/**
 * The line every subject answer must carry (developer note of 17 Nov 2026,
 * SUBJECT CHOICES). The model drops it under the two-to-four-sentence limit,
 * most often in Arabic, so the server adds it when a reply that used the
 * subject guide does not point to the counsellor already.
 */
export const SUBJECT_CLOSING: Record<Locale, string> = {
  en: "Requirements differ between universities and change, so your school counsellor and the university's official website have the final word.",
  ar: "تختلف الشروط بين الجامعات وتتغيّر، والكلمة الأخيرة للمرشد المدرسي والموقع الرسمي للجامعة.",
};

const ALREADY_POINTS_TO_COUNSELLOR = /counsell?or|المرشد|مرشد/i;

export function withSubjectClosing(text: string, usedSubjectGuide: boolean, locale: Locale): string {
  if (!usedSubjectGuide || ALREADY_POINTS_TO_COUNSELLOR.test(text)) return text;
  return `${text.trim()} ${SUBJECT_CLOSING[locale]}`;
}
