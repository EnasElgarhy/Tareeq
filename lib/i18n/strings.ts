import type { Locale } from "@/lib/i18n/locale";

interface Entry {
  en: string;
  ar: string;
}

/**
 * UI chrome string catalog. Assessment *content* (questions + options) is
 * already bilingual in the seed; this covers the surrounding UI text.
 */
export const STRINGS = {
  // ---- Language chooser ----
  "lang.title": { en: "Choose your language", ar: "اختر لغتك" },
  "lang.subtitle": {
    en: "Pick the language for your assessment.",
    ar: "اختر لغة التقييم الخاص بك.",
  },
  "lang.en.name": { en: "English", ar: "English" },
  "lang.en.note": { en: "Continue in English", ar: "المتابعة بالإنجليزية" },
  "lang.ar.name": { en: "العربية", ar: "العربية" },
  "lang.ar.note": { en: "المتابعة بالعربية", ar: "المتابعة بالعربية" },
  "lang.hint": {
    en: "You can switch anytime from the header.",
    ar: "يمكنك التبديل في أي وقت من الأعلى.",
  },

  // ---- Navigation / common ----
  "nav.continue": { en: "Continue", ar: "متابعة" },
  "nav.begin": { en: "Begin", ar: "ابدأ" },
  "nav.back": { en: "Back", ar: "رجوع" },
  "nav.next": { en: "Next", ar: "التالي" },
  "nav.skip": { en: "Skip", ar: "تخطّي" },
  "nav.done": { en: "Done", ar: "تم" },
  "common.of": { en: "of", ar: "من" },
  "question.reflect_placeholder": {
    en: "Type your reflection…",
    ar: "اكتب تأمّلك هنا…",
  },

  // ---- Intro / Kai ----
  "intro.getting_ready": { en: "Kai is getting ready.", ar: "كاي يستعد." },
  "intro.meet": { en: "Meet Kai", ar: "تعرّف على كاي" },
  "intro.meet_prefix": { en: "Meet ", ar: "تعرّف على " },
  "intro.kai_name": { en: "Kai", ar: "كاي" },
  "intro.body": {
    en: "Think of me as a filter for all the noise. We’re looking for your Energy Flows — the stuff that makes you lose track of time. Pick what you’d actually do.",
    ar: "اعتبرني فلتراً يُبعد عنك كل الضجيج. نحن نبحث عن مساراتك التي تتدفّق فيها طاقتك — الأشياء التي تُنسيك الوقت. اختر ما ستفعله فعلاً.",
  },

  // ---- Section encouragements (also narration) ----
  "kai.intro": {
    en: "Hey, I'm Kai. Think of me as a filter for all the noise. There are no wrong answers here — just pick what you would actually do, or the closest thing to it.",
    ar: "أهلاً، أنا كاي. اعتبرني فلتراً يُبعد عنك كل الضجيج. لا توجد إجابات خاطئة هنا — فقط اختر ما ستفعله فعلاً، أو أقرب شيء إليه.",
  },
  "kai.after_10": {
    en: "Nice progress. Your curiosity pattern is starting to take shape. Keep choosing what feels true to you.",
    ar: "تقدّم رائع. بدأ نمط فضولك يتّضح. استمر باختيار ما يشبهك فعلاً.",
  },
  "kai.after_20": {
    en: "You are doing well. This next part looks at how you like to work, not what anyone expects from you.",
    ar: "أنت تبلي حسناً. هذا الجزء التالي يستكشف الطريقة التي تحب أن تعمل بها، لا ما يتوقعه منك الآخرون.",
  },
  "kai.after_30": {
    en: "Stay with it. The next questions help us understand what keeps you motivated when work gets real.",
    ar: "واصل التركيز. الأسئلة التالية تساعدنا على فهم ما يبقيك متحمساً حين يصبح العمل جدّياً.",
  },
  "kai.after_40": {
    en: "Almost there. These final answers help me see the kind of environment where you can actually grow.",
    ar: "اقتربنا. هذه الإجابات الأخيرة تساعدني على رؤية البيئة التي يمكنك أن تنمو فيها حقاً.",
  },
  "kai.results": {
    en: "Nice work. Here's your Career Compass. Remember — this is a compass, not a GPS. You still get to choose the destination.",
    ar: "عمل رائع. هذه بوصلتك المهنية. تذكّر — إنها بوصلة، لا خريطة تقودك خطوة بخطوة. ما زلت أنت من يختار الوجهة.",
  },

  // ---- Audio controls ----
  "audio.mute": { en: "Mute Kai's voice", ar: "كتم صوت كاي" },
  "audio.unmute": { en: "Unmute Kai's voice", ar: "تشغيل صوت كاي" },
  "audio.replay": { en: "Replay Kai's voice", ar: "إعادة صوت كاي" },
} as const satisfies Record<string, Entry>;

export type StringKey = keyof typeof STRINGS;

export function translate(locale: Locale, key: StringKey): string {
  const entry = STRINGS[key];
  return entry[locale] ?? entry.en ?? key;
}
