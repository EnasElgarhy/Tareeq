export const APPROVED_KAI_ENGLISH_VOICE = {
  id: "ZF6FPAbjXT4488VcRRnw",
  accent: "british",
  gender: "female",
  modelId: "eleven_multilingual_v2",
  outputFormat: "mp3_44100_128",
  settings: {
    stability: 0.48,
    similarity_boost: 0.84,
    style: 0.28,
    speed: 1,
  },
} as const;

export function shortAudioLocale(locale: string): string {
  return locale.split("-", 1)[0]?.toLowerCase() || "en";
}

export function isPersistedAssessmentVoiceAllowed(
  locale: string,
  voiceId: string | null,
): boolean {
  return (
    shortAudioLocale(locale) !== "en" ||
    voiceId === APPROVED_KAI_ENGLISH_VOICE.id
  );
}
