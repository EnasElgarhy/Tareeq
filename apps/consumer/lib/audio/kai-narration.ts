import { CORE_ASSESSMENT_QUESTIONS } from "@/lib/core-v2/assessment";
import { defaultLocale } from "@/lib/content/seed";
import { assessmentQuestions } from "@/lib/assessment/questions";

type LocalizedRecord = Readonly<Record<string, string>>;

export const KAI_SECTION_ENCOURAGEMENTS = [
  {
    key: "after-10",
    audioId: "kai_after_10",
    text: {
      en: "Nice progress. Your curiosity pattern is starting to take shape. Keep choosing what feels true to you.",
      ar: "تقدُّمٌ جميل. بدأ نمط فضولك يتّضح. واصِل اختيار ما تشعر أنه يمثّلك حقًّا.",
    },
  },
  {
    key: "after-20",
    audioId: "kai_after_20",
    text: {
      en: "You are doing well. This next part looks at how you like to work, not what anyone expects from you.",
      ar: "أنت تبلي بلاءً حسنًا. يتناول هذا الجزء التالي الطريقة التي تحب أن تعمل بها، لا ما يتوقّعه منك الآخرون.",
    },
  },
  {
    key: "after-30",
    audioId: "kai_after_30",
    text: {
      en: "Stay with it. The next questions help us understand what keeps you motivated when work gets real.",
      ar: "واصِل معنا. تساعدنا الأسئلة التالية على فهم ما يبقيك متحمّسًا حين يصبح العمل جادًّا.",
    },
  },
  {
    key: "after-40",
    audioId: "kai_after_40",
    text: {
      en: "Almost there. These final answers help me see the kind of environment where you can actually grow.",
      ar: "اقتربتَ من النهاية. تساعدني هذه الإجابات الأخيرة على رؤية نوع البيئة التي يمكنك أن تنمو فيها فعلًا.",
    },
  },
] as const;

export const KAI_EXTRA_NARRATION = [
  {
    id: "kai_intro",
    text: {
      en: "Hi, I'm Kai, your personal career coach. I'll be with you through the questions, and once your report is ready, we can talk it through together.",
      ar: "مرحبًا، أنا كاي، مدرّبتك المهنية الشخصية. سأرافقك خلال الأسئلة، وعندما يصبح تقريرك جاهزًا يمكننا مناقشته معًا.",
    },
  },
  {
    id: "kai_results",
    text: {
      en: "Nice work. Here's your Career Compass. Remember — this is a compass, not a GPS. You still get to choose the destination.",
      ar: "أحسنت. هذه بوصلتك المهنية. وتذكّر — إنها بوصلة، وليست نظام تحديد مواقع. فالوجهة تبقى من اختيارك أنت.",
    },
  },
] as const;

function getLocalizedText(text: LocalizedRecord, locale: string) {
  const shortLocale = locale.split("-", 1)[0] ?? locale;
  return (
    text[locale] ??
    text[shortLocale] ??
    text[defaultLocale] ??
    Object.values(text)[0] ??
    ""
  );
}

export function getKaiNarrationManifest(locale = defaultLocale) {
  return [
    ...[...assessmentQuestions, ...CORE_ASSESSMENT_QUESTIONS].map(
      (question) => ({
        id: question.externalId,
        text: getLocalizedText(question.title as LocalizedRecord, locale),
      }),
    ),
    ...KAI_SECTION_ENCOURAGEMENTS.map((line) => ({
      id: line.audioId,
      text: getLocalizedText(line.text as LocalizedRecord, locale),
    })),
    ...KAI_EXTRA_NARRATION.map((line) => ({
      id: line.id,
      text: getLocalizedText(line.text as LocalizedRecord, locale),
    })),
  ];
}

export function getKaiNarrationText(audioId: string, locale = defaultLocale) {
  return (
    getKaiNarrationManifest(locale).find((line) => line.id === audioId)?.text ??
    null
  );
}
