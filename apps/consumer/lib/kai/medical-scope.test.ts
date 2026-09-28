import { describe, expect, it } from "vitest";
import { medicalScopeRedirect } from "@/lib/kai/chat-server";

describe("Kai medical scope redirect", () => {
  it.each([
    "I have chest pain. What medicine should I take?",
    "Can you diagnose this rash?",
    "I am experiencing a high fever and need treatment.",
  ])("redirects personal medical advice in English: %s", (message) => {
    const redirect = medicalScopeRedirect(message, "en");

    expect(redirect?.text).toContain("career and education guidance");
    expect(redirect?.text).toContain("healthcare professional");
    expect(redirect?.intent).toBe("general_question");
  });

  it.each([
    "عندي ألم في الصدر، ما الدواء الذي آخذه؟",
    "هل يمكنك تشخيص هذا الطفح؟",
    "أشعر بدوخة وأحتاج إلى علاج",
  ])("redirects personal medical advice in Arabic: %s", (message) => {
    const redirect = medicalScopeRedirect(message, "ar");

    expect(redirect?.text).toContain("الإرشاد المهني والتعليمي");
    expect(redirect?.text).toContain("مختص صحي");
    expect(redirect?.intent).toBe("general_question");
  });

  it.each([
    "Should I study medicine or biomedical engineering?",
    "What careers can I pursue after medical school?",
    "هل تخصص الطب مناسب لي؟",
    "كيف أصبح طبيبة؟",
  ])("keeps healthcare career questions in scope: %s", (message) => {
    expect(medicalScopeRedirect(message, "en")).toBeNull();
  });
});
