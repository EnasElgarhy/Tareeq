export type AssessmentAudioSourceKind = "static" | "api";

export type AssessmentAudioSource = {
  src: string;
  kind: AssessmentAudioSourceKind;
};

export type ResolveAssessmentNarrationSourcesOptions = {
  audioId: string;
  locale?: string;
  fallbackSources?: Array<string | AssessmentAudioSource>;
};

const STATIC_EXTENSIONS = ["m4a", "mp3"] as const;
const LOCALIZED_STATIC_IDS = new Set([
  "kai_after_10",
  "kai_after_20",
  "kai_after_30",
  "kai_after_40",
  "kai_intro",
  "kai_results",
]);
const ENGLISH_ASSESSMENT_VOICE_STATIC_IDS = new Set([
  "kai_intro",
  "kai_results",
]);

function shortLocaleOf(locale = "en") {
  return locale.split("-", 1)[0]?.toLowerCase() || "en";
}

function apiSource(audioId: string, locale = "en"): AssessmentAudioSource {
  return {
    kind: "api",
    src: `/api/kai-tts/${encodeURIComponent(audioId)}?locale=${encodeURIComponent(locale)}`,
  };
}

function staticSource(src: string): AssessmentAudioSource {
  return { kind: "static", src };
}

function normalizeFallbackSource(
  source: string | AssessmentAudioSource,
): AssessmentAudioSource {
  return typeof source === "string"
    ? {
        kind: source.startsWith("/api/") ? "api" : "static",
        src: source,
      }
    : source;
}

export function isQuestionStaticAudioId(audioId: string) {
  return /^(Q|QD|QT)\d+$/.test(audioId);
}

export function resolveAssessmentNarrationSources({
  audioId,
  locale = "en",
  fallbackSources = [],
}: ResolveAssessmentNarrationSourcesOptions): AssessmentAudioSource[] {
  const shortLocale = shortLocaleOf(locale);
  const sources: AssessmentAudioSource[] = [];

  for (const source of fallbackSources) {
    sources.push(normalizeFallbackSource(source));
  }

  if (
    shortLocale === "en" &&
    ENGLISH_ASSESSMENT_VOICE_STATIC_IDS.has(audioId)
  ) {
    for (const extension of STATIC_EXTENSIONS) {
      sources.push(staticSource(`/audio/${audioId}.${extension}`));
    }
  } else if (
    LOCALIZED_STATIC_IDS.has(audioId) &&
    (shortLocale === "en" || shortLocale === "ar")
  ) {
    sources.push(staticSource(`/audio/${audioId}.${shortLocale}.mp3`));
  }

  if (isQuestionStaticAudioId(audioId) && shortLocale === "en") {
    for (const extension of STATIC_EXTENSIONS) {
      sources.push(staticSource(`/audio/${audioId}.${extension}`));
    }
  }

  if (
    shortLocale === "en" &&
    !LOCALIZED_STATIC_IDS.has(audioId) &&
    !isQuestionStaticAudioId(audioId)
  ) {
    for (const extension of STATIC_EXTENSIONS) {
      sources.push(staticSource(`/audio/${audioId}.${extension}`));
    }
  }

  sources.push(apiSource(audioId, locale));

  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.src)) return false;
    seen.add(source.src);
    return true;
  });
}

export function firstPreloadableAssessmentAudioSource(
  sources: AssessmentAudioSource[],
) {
  return sources.find((source) => source.kind === "static") ?? null;
}
