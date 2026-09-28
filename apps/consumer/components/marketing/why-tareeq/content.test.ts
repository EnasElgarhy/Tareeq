import { describe, expect, it } from "vitest";
import { STRINGS } from "@/lib/i18n/strings";
import { AUDIENCES } from "../whyTareeqContent";
import { PANEL_COPY } from "./content";

const hasBothLocales = (key: string) => {
  const entry = (STRINGS as Record<string, { en?: string; ar?: string }>)[key];
  return Boolean(entry?.en && entry?.ar);
};

describe("why-tareeq panel content", () => {
  it("builds only string keys that exist in English and Arabic", () => {
    const keys = AUDIENCES.flatMap((a) => {
      const { headline, description, reasons } = PANEL_COPY[a];
      return [
        headline,
        description,
        ...reasons.flatMap((r) => [r.title, r.body]),
      ];
    });
    expect(keys.filter((k) => !hasBothLocales(k))).toEqual([]);
  });

  it("gives each audience exactly four reasons", () => {
    for (const a of AUDIENCES) expect(PANEL_COPY[a].reasons).toHaveLength(4);
  });
});
