import { describe, expect, it } from "vitest";
import { detectIntent, KAI_MESSAGE_INTENTS } from "@/lib/kai/intent";

describe("detectIntent", () => {
  it("detects family_conversation in English", () => {
    expect(detectIntent("How do I convince my family to support this?")).toBe("family_conversation");
  });

  it("detects family_conversation in Arabic", () => {
    expect(detectIntent("كيف أقنع أهلي بهذا القرار؟")).toBe("family_conversation");
  });

  it("detects resource_recommendation in English", () => {
    expect(detectIntent("Can you recommend some videos about this career?")).toBe("resource_recommendation");
  });

  it("detects resource_recommendation in Arabic", () => {
    expect(detectIntent("هل يمكنك أن توصي بفيديوهات عن هذا المجال؟")).toBe("resource_recommendation");
  });

  it("detects study_plan in English before falling to the broader action_plan pattern", () => {
    expect(detectIntent("Can you help me build a study plan for my exams?")).toBe("study_plan");
  });

  it("detects study_plan in Arabic", () => {
    expect(detectIntent("أحتاج خطة دراسة للامتحانات")).toBe("study_plan");
  });

  it("detects action_plan in English", () => {
    expect(detectIntent("Build me a 7-day plan to get started")).toBe("action_plan");
  });

  it("detects action_plan in Arabic", () => {
    expect(detectIntent("أعطني خطة من 7 أيام للبدء")).toBe("action_plan");
  });

  it("detects career_comparison in English", () => {
    expect(detectIntent("Should I compare software engineer vs data scientist?")).toBe("career_comparison");
  });

  it("detects career_comparison in Arabic", () => {
    expect(detectIntent("قارن لي بين المحاماة والدبلوماسية")).toBe("career_comparison");
  });

  it("detects university_guidance in English", () => {
    expect(detectIntent("Which university major fits my result?")).toBe("university_guidance");
  });

  it("detects university_guidance in Arabic", () => {
    expect(detectIntent("ما هو التخصص الجامعي المناسب لي؟")).toBe("university_guidance");
  });

  it("detects challenge_result in English", () => {
    expect(detectIntent("I disagree, this doesn't sound like me at all")).toBe("challenge_result");
  });

  it("detects challenge_result in Arabic", () => {
    expect(detectIntent("لا أتفق مع هذه النتيجة")).toBe("challenge_result");
  });

  it("detects confidence_building in English", () => {
    expect(detectIntent("I'm really nervous I'm not good enough for this path")).toBe("confidence_building");
  });

  it("detects confidence_building in Arabic", () => {
    expect(detectIntent("أشعر بالقلق ولست واثقًا من نفسي")).toBe("confidence_building");
  });

  it("detects next_step in English", () => {
    expect(detectIntent("What's my next step from here?")).toBe("next_step");
  });

  it("detects next_step in Arabic", () => {
    expect(detectIntent("ما هي الخطوة التالية؟")).toBe("next_step");
  });

  it("detects explain_result in English", () => {
    expect(detectIntent("Can you explain my result in more depth?")).toBe("explain_result");
  });

  it("detects explain_result in Arabic", () => {
    expect(detectIntent("اشرح لي نتيجتي أكثر")).toBe("explain_result");
  });

  it("falls back to general_question for unmatched text", () => {
    expect(detectIntent("Hey Kai, how's it going today?")).toBe("general_question");
  });

  it("falls back to general_question for empty or whitespace-only input", () => {
    expect(detectIntent("   ")).toBe("general_question");
    expect(detectIntent("")).toBe("general_question");
  });

  it("exports all 11 intents in KAI_MESSAGE_INTENTS", () => {
    expect(KAI_MESSAGE_INTENTS).toHaveLength(11);
    expect(KAI_MESSAGE_INTENTS).toContain("general_question");
  });
});
