import type { Locale } from "@/lib/i18n/locale";

/**
 * Arabic names for the country list. The English name stays the stored
 * value (answers, analytics, admin), so only the label changes. Written by
 * hand: the browser's own names differ by engine, and say
 * "الأراضي الفلسطينية" for Palestine.
 */
const ARABIC_COUNTRY_NAMES: Readonly<Record<string, string>> = {
  "United Arab Emirates": "الإمارات العربية المتحدة",
  "Saudi Arabia": "السعودية",
  Egypt: "مصر",
  Jordan: "الأردن",
  Lebanon: "لبنان",
  Qatar: "قطر",
  Kuwait: "الكويت",
  Bahrain: "البحرين",
  Oman: "عُمان",
  Morocco: "المغرب",
  Tunisia: "تونس",
  Algeria: "الجزائر",
  Iraq: "العراق",
  Palestine: "فلسطين",
  Syria: "سوريا",
  Yemen: "اليمن",
  Libya: "ليبيا",
  Sudan: "السودان",
  "United States": "الولايات المتحدة",
  "United Kingdom": "المملكة المتحدة",
  Canada: "كندا",
  Australia: "أستراليا",
  France: "فرنسا",
  Germany: "ألمانيا",
  Spain: "إسبانيا",
  Italy: "إيطاليا",
  Netherlands: "هولندا",
  Sweden: "السويد",
  Norway: "النرويج",
  Denmark: "الدنمارك",
  Turkey: "تركيا",
  India: "الهند",
  Pakistan: "باكستان",
  Bangladesh: "بنغلاديش",
  Indonesia: "إندونيسيا",
  Malaysia: "ماليزيا",
  Singapore: "سنغافورة",
  Japan: "اليابان",
  "South Korea": "كوريا الجنوبية",
  China: "الصين",
  "South Africa": "جنوب أفريقيا",
  Nigeria: "نيجيريا",
  Kenya: "كينيا",
  Brazil: "البرازيل",
  Mexico: "المكسيك",
  Argentina: "الأرجنتين",
  Other: "أخرى",
};

/** The label for a stored country value; unknown values show as stored. */
export function countryLabel(country: string, locale: Locale): string {
  if (locale !== "ar") return country;
  return ARABIC_COUNTRY_NAMES[country] ?? country;
}
