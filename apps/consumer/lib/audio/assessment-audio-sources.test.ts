import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  firstPreloadableAssessmentAudioSource,
  resolveAssessmentNarrationSources,
} from "./assessment-audio-sources";

describe("resolveAssessmentNarrationSources", () => {
  it("keeps the approved English assessment narrator intro recording", () => {
    const introAudio = readFileSync(
      resolve(process.cwd(), "public/audio/kai_intro.m4a"),
    );

    expect(createHash("sha256").update(introAudio).digest("hex")).toBe(
      "956a785c3642a7405575f9d6ac8fa2a73696e3031700047c99436b51c78e7b50",
    );
  });

  it("prefers baked English question audio before the TTS API", () => {
    expect(
      resolveAssessmentNarrationSources({ audioId: "Q12", locale: "en" }),
    ).toEqual([
      { kind: "static", src: "/audio/Q12.m4a" },
      { kind: "static", src: "/audio/Q12.mp3" },
      { kind: "api", src: "/api/kai-tts/Q12?locale=en" },
    ]);
  });

  it("does not preload generic question audio for Arabic", () => {
    expect(
      resolveAssessmentNarrationSources({ audioId: "Q12", locale: "ar" }),
    ).toEqual([{ kind: "api", src: "/api/kai-tts/Q12?locale=ar" }]);
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

  it("uses the assessment narrator for English and localized Arabic intro", () => {
    expect(
      resolveAssessmentNarrationSources({
        audioId: "kai_intro",
        locale: "en",
      }),
    ).toEqual([
      { kind: "static", src: "/audio/kai_intro.m4a" },
      { kind: "static", src: "/audio/kai_intro.mp3" },
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
      { kind: "static", src: "/audio/custom-q3.m4a" },
      { kind: "static", src: "/audio/Q3.m4a" },
      { kind: "static", src: "/audio/Q3.mp3" },
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
      src: "/audio/Q7.m4a",
    });
  });
});
