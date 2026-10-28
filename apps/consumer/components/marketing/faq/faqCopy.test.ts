import { describe, expect, it } from "vitest";
import { FAQ_COPY, faqStructuredData } from "./faqCopy";

describe("FAQ copy", () => {
  it("has the same groups and questions in both languages", () => {
    const shape = (locale: "en" | "ar") => FAQ_COPY[locale].groups.map((g) => g.items.length);
    expect(shape("ar")).toEqual(shape("en"));
    expect(shape("en")).toEqual([6, 7, 5, 6]);
  });

  it("publishes one FAQPage per language with every question", () => {
    const data = faqStructuredData() as { "@graph": { inLanguage: string; mainEntity: unknown[] }[] };
    expect(data["@graph"].map((page) => page.inLanguage)).toEqual(["en", "ar"]);
    expect(data["@graph"][0].mainEntity).toHaveLength(24);
    expect(data["@graph"][1].mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "لمن تقييم كور؟",
    });
  });
});
