import { describe, expect, it } from "vitest";
import { SUBJECT_CLOSING, withSubjectClosing } from "./subject-closing";

describe("withSubjectClosing", () => {
  it("adds the closing line to a subject reply that lacks it, in the student's language", () => {
    expect(withSubjectClosing("Students usually take biology.", true, "en")).toBe(
      `Students usually take biology. ${SUBJECT_CLOSING.en}`,
    );
    expect(withSubjectClosing("عادةً ما يختار الطلاب مسار الحاسب.", true, "ar")).toBe(
      `عادةً ما يختار الطلاب مسار الحاسب. ${SUBJECT_CLOSING.ar}`,
    );
  });

  it("leaves a reply that already points to the counsellor", () => {
    const en = "Students usually take maths. Your school counsellor has the final word.";
    const ar = "يختار الطلاب الرياضيات. والكلمة الأخيرة للمرشد المدرسي.";
    expect(withSubjectClosing(en, true, "en")).toBe(en);
    expect(withSubjectClosing(ar, true, "ar")).toBe(ar);
  });

  it("leaves replies that do not use the subject guide", () => {
    expect(withSubjectClosing("What drew you to that project?", false, "en")).toBe(
      "What drew you to that project?",
    );
  });
});
