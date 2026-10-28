/**
 * The brand, in one place (28 Oct update, Part A.3): every page title, link
 * preview, wordmark, footer line and email reads from here, so a future name
 * or address change is one edit. In Arabic text the name is written
 * ماب ماي كور; the logo itself stays in Latin script.
 */
export const BRAND = {
  name: "Map My CORE",
  nameAr: "ماب ماي كور",
  domain: "mapmycore.com",
  siteUrl: "https://mapmycore.com",
  supportEmail: "support@mapmycore.com",
  company: "The ME Project (FZE)",
  copyrightYear: 2026,
} as const;

export function brandName(locale: string): string {
  return locale === "ar" ? BRAND.nameAr : BRAND.name;
}

/** "© 2026 The ME Project (FZE). All rights reserved." */
export function copyrightLine(locale: string): string {
  return locale === "ar"
    ? `\u200F© ${BRAND.copyrightYear} ${BRAND.company}. جميع الحقوق محفوظة.`
    : `© ${BRAND.copyrightYear} ${BRAND.company}. All rights reserved.`;
}
