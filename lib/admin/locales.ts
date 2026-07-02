/**
 * Single source of truth for the locales the assessment builder supports.
 * Every translation tab, coverage view, and publish validator iterates this —
 * no hardcoded "en"/"ar" scattered across components. Adding a locale here
 * extends the whole admin surface (the content model is jsonb keyed by locale,
 * not en/ar columns).
 */
export const SUPPORTED_LOCALES = ["en", "ar"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
