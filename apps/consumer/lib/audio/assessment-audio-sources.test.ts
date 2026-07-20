import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getKaiNarrationManifest } from "./kai-narration";
import {
  APPROVED_KAI_ENGLISH_VOICE,
  isPersistedAssessmentVoiceAllowed,
} from "./assessment-voice";
import {
  firstPreloadableAssessmentAudioSource,
  resolveAssessmentNarrationSources,
} from "./assessment-audio-sources";

type EnglishVoiceManifest = {
  schemaVersion: number;
  locale: string;
  voice: {
    id: string;
    accent: string;
    gender: string;
    modelId: string;
  };
  clips: Array<{
    audioId: string;
    path: string;
    bytes: number;
    sha256: string;
  }>;
};

describe("resolveAssessmentNarrationSources", () => {
  it("rejects persisted English clips from any other voice", () => {
    expect(
      isPersistedAssessmentVoiceAllowed(
        "en-GB",
        APPROVED_KAI_ENGLISH_VOICE.id,
      ),
    ).toBe(true);
    expect(isPersistedAssessmentVoiceAllowed("en", "another-voice")).toBe(
      false,
    );
    expect(isPersistedAssessmentVoiceAllowed("en", null)).toBe(false);
    expect(isPersistedAssessmentVoiceAllowed("ar", "arabic-voice")).toBe(true);
  });

  it("keeps a baked Arabic clip for every assessment question", () => {
    const audioIds = [
      ...Array.from({ length: 4 }, (_, index) => `QD${index + 1}`),
      ...Array.from({ length: 40 }, (_, index) => `Q${index + 1}`),
      ...Array.from({ length: 10 }, (_, index) => `QT${index + 1}`),
    ];

    for (const audioId of audioIds) {
      expect(
        statSync(resolve(process.cwd(), `public/audio/${audioId}.ar.mp3`)).size,
      ).toBeGreaterThan(1_000);
    }
  });

  it("locks every English narration clip to the approved British voice bake", () => {
    const manifest = JSON.parse(
      readFileSync(
        resolve(
          process.cwd(),
          "public/audio/en-british-v1/voice-manifest.json",
        ),
        "utf8",
      ),
    ) as EnglishVoiceManifest;
    const expectedAudioIds = getKaiNarrationManifest("en")
      .map(({ id }) => id)
      .sort();

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.locale).toBe("en");
    expect(manifest.voice).toMatchObject({
      id: APPROVED_KAI_ENGLISH_VOICE.id,
      accent: APPROVED_KAI_ENGLISH_VOICE.accent,
      gender: APPROVED_KAI_ENGLISH_VOICE.gender,
      modelId: APPROVED_KAI_ENGLISH_VOICE.modelId,
    });
    expect(manifest.clips.map(({ audioId }) => audioId).sort()).toEqual(
      expectedAudioIds,
    );

    for (const clip of manifest.clips) {
      const audio = readFileSync(
        resolve(process.cwd(), "public", clip.path.replace(/^\//, "")),
      );
      expect(audio.byteLength).toBe(clip.bytes);
      expect(createHash("sha256").update(audio).digest("hex")).toBe(
        clip.sha256,
      );
      expect(
        resolveAssessmentNarrationSources({
          audioId: clip.audioId,
          locale: "en",
        })[0],
      ).toEqual({ kind: "static", src: clip.path });
    }
  });

  it("prefers baked English question audio before the TTS API", () => {
    expect(
      resolveAssessmentNarrationSources({ audioId: "Q12", locale: "en" }),
    ).toEqual([
      { kind: "static", src: "/audio/en-british-v1/Q12.mp3" },
      { kind: "api", src: "/api/kai-tts/Q12?locale=en" },
    ]);
  });

  it("prefers baked Arabic question audio before the TTS API", () => {
    expect(
      resolveAssessmentNarrationSources({ audioId: "Q12", locale: "ar" }),
    ).toEqual([
      { kind: "static", src: "/audio/Q12.ar.mp3" },
      { kind: "api", src: "/api/kai-tts/Q12?locale=ar" },
    ]);
  });

  it("never uses unlocalized static narration for Arabic", () => {
    expect(
      resolveAssessmentNarrationSources({
        audioId: "custom_prompt",
        locale: "ar",
      }),
    ).toEqual([
      {
        kind: "api",
        src: "/api/kai-tts/custom_prompt?locale=ar",
      },
    ]);
  });

  it("uses localized static interstitial files before the TTS API", () => {
    expect(
      resolveAssessmentNarrationSources({
        audioId: "kai_after_10",
        locale: "ar",
      }),
    ).toEqual([
      { kind: "static", src: "/audio/kai_after_10.ar.mp3" },
      { kind: "api", src: "/api/kai-tts/kai_after_10?locale=ar" },
    ]);
  });

  it("uses the canonical English voice for interstitials", () => {
    expect(
      resolveAssessmentNarrationSources({
        audioId: "kai_after_10",
        locale: "en",
      }),
    ).toEqual([
      {
        kind: "static",
        src: "/audio/en-british-v1/kai_after_10.mp3",
      },
      { kind: "api", src: "/api/kai-tts/kai_after_10?locale=en" },
    ]);
  });

  it("uses the canonical English voice and localized Arabic intro", () => {
    expect(
      resolveAssessmentNarrationSources({
        audioId: "kai_intro",
        locale: "en",
      }),
    ).toEqual([
      { kind: "static", src: "/audio/en-british-v1/kai_intro.mp3" },
      { kind: "api", src: "/api/kai-tts/kai_intro?locale=en" },
    ]);

    expect(
      resolveAssessmentNarrationSources({
        audioId: "kai_intro",
        locale: "ar",
      }),
    ).toEqual([
      { kind: "static", src: "/audio/kai_intro.ar.mp3" },
      { kind: "api", src: "/api/kai-tts/kai_intro?locale=ar" },
    ]);
  });

  it("keeps explicit fallback sources first and de-duplicates by URL", () => {
    expect(
      resolveAssessmentNarrationSources({
        audioId: "Q3",
        locale: "en-US",
        fallbackSources: [
          "/audio/custom-q3.m4a",
          { kind: "static", src: "/audio/Q3.m4a" },
        ],
      }),
    ).toEqual([
      { kind: "static", src: "/audio/en-british-v1/Q3.mp3" },
      { kind: "static", src: "/audio/custom-q3.m4a" },
      { kind: "static", src: "/audio/Q3.m4a" },
      { kind: "api", src: "/api/kai-tts/Q3?locale=en-US" },
    ]);
  });

  it("returns the first static source as the preload candidate", () => {
    const sources = resolveAssessmentNarrationSources({
      audioId: "Q7",
      locale: "en",
    });

    expect(firstPreloadableAssessmentAudioSource(sources)).toEqual({
      kind: "static",
      src: "/audio/en-british-v1/Q7.mp3",
    });
  });
});
