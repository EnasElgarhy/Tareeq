import { defaultLocale, seedQuestions } from "@/lib/content/seed";

type LocalizedRecord = Readonly<Record<string, string>>;

export const KAI_SECTION_ENCOURAGEMENTS = [
  {
    key: "after-10",
    audioId: "kai_after_10",
    text: "Nice progress. Your curiosity pattern is starting to take shape. Keep choosing what feels true to you.",
  },
  {
    key: "after-20",
    audioId: "kai_after_20",
    text: "You are doing well. This next part looks at how you like to work, not what anyone expects from you.",
  },
  {
    key: "after-30",
    audioId: "kai_after_30",
    text: "Stay with it. The next questions help us understand what keeps you motivated when work gets real.",
  },
  {
    key: "after-40",
    audioId: "kai_after_40",
    text: "Almost there. These final answers help me see the kind of environment where you can actually grow.",
  },
] as const;

export const KAI_EXTRA_NARRATION = [
  {
    id: "kai_intro",
    text: "Hey, I'm Kai. Think of me as a filter for all the noise. There are no wrong answers here — just pick what you would actually do, or the closest thing to it.",
  },
  {
    id: "kai_results",
    text: "Nice work. Here's your Career Compass. Remember — this is a compass, not a GPS. You still get to choose the destination.",
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
    ...seedQuestions.map((question) => ({
      id: question.externalId,
      text: getLocalizedText(question.title as LocalizedRecord, locale),
    })),
    ...KAI_SECTION_ENCOURAGEMENTS.map((line) => ({
      id: line.audioId,
      text: line.text,
    })),
    ...KAI_EXTRA_NARRATION,
  ];
}

export function getKaiNarrationText(audioId: string, locale = defaultLocale) {
  return (
    getKaiNarrationManifest(locale).find((line) => line.id === audioId)?.text ??
    null
  );
}
