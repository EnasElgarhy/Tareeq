import { describe, expect, it } from "vitest";
import { countriesMiddleEast, countriesRest } from "@/lib/content/seed";
import { countryLabel } from "./country-names";

describe("countryLabel", () => {
  it("keeps the English name in English", () => {
    expect(countryLabel("Jordan", "en")).toBe("Jordan");
  });

  it("names every listed country in Arabic", () => {
    for (const country of [...countriesMiddleEast, ...countriesRest]) {
      expect(countryLabel(country, "ar")).not.toMatch(/[A-Za-z]/);
    }
    expect(countryLabel("Palestine", "ar")).toBe("فلسطين");
  });

  it("shows an unknown value as stored", () => {
    expect(countryLabel("Atlantis", "ar")).toBe("Atlantis");
  });
});
