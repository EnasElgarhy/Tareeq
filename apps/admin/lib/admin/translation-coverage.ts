/**
 * Pure bilingual-coverage analysis for a Custom assessment: which required
 * localized fields are missing a supported locale. No IO — used by the
 * Translations tab and the publish guard.
 */

export type TranslatableKind = "category" | "question" | "option" | "profile";

export interface TranslationGap {
  kind: TranslatableKind;
  /** Human ref: category/profile code, question external_id, or "Q/letter". */
  ref: string;
  field: string;
  locale: string;
}

export interface CoverageInput {
  supportedLocales: readonly string[];
  categories: { code: string; name: Record<string, string> }[];
  questions: {
    external_id: string;
    title: Record<string, string>;
    options: { letter: string; text: Record<string, string> }[];
  }[];
  profiles: { code: string | null; name: Record<string, string> }[];
}

function missingLocales(
  text: Record<string, string> | null | undefined,
  locales: readonly string[],
): string[] {
  return locales.filter((l) => !(text?.[l] ?? "").trim());
}

export function findMissingTranslations(input: CoverageInput): TranslationGap[] {
  const gaps: TranslationGap[] = [];
  const { supportedLocales: locales } = input;

  for (const c of input.categories) {
    for (const locale of missingLocales(c.name, locales)) {
      gaps.push({ kind: "category", ref: c.code, field: "name", locale });
    }
  }
  for (const q of input.questions) {
    for (const locale of missingLocales(q.title, locales)) {
      gaps.push({ kind: "question", ref: q.external_id, field: "title", locale });
    }
    for (const o of q.options) {
      for (const locale of missingLocales(o.text, locales)) {
        gaps.push({
          kind: "option",
          ref: `${q.external_id}/${o.letter}`,
          field: "text",
          locale,
        });
      }
    }
  }
  for (const p of input.profiles) {
    for (const locale of missingLocales(p.name, locales)) {
      gaps.push({ kind: "profile", ref: p.code ?? "?", field: "name", locale });
    }
  }
  return gaps;
}

/** Gap counts per locale (for the coverage summary UI + publish messaging). */
export function coverageByLocale(
  gaps: readonly TranslationGap[],
  locales: readonly string[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of locales) counts[l] = 0;
  for (const g of gaps) counts[g.locale] = (counts[g.locale] ?? 0) + 1;
  return counts;
}
