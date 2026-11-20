import { describe, expect, test } from "vitest";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_INTRO,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
  type LegalBlock,
  type LegalSection,
} from "@/components/marketing/legal/legalCopy";

function blockText(block: LegalBlock): string {
  if (typeof block === "string") return block;
  if ("items" in block) {
    return block.items.map((item) => (typeof item === "string" ? item : `${item.label} ${item.text}`)).join(" ");
  }
  return [...block.table.head, ...block.table.rows.flat()].join(" ");
}

const allText = (sections: readonly LegalSection[]) =>
  sections.flatMap((section) => [section.title, ...section.blocks.map(blockText)]).join(" ");

describe("legal copy", () => {
  test("gives every section its own link target", () => {
    for (const sections of [PRIVACY_SECTIONS, TERMS_SECTIONS]) {
      const ids = sections.map((section) => section.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test("covers the sections of the 19 Nov document", () => {
    expect(PRIVACY_SECTIONS.map((section) => section.title)).toEqual([
      "Who we are",
      "What we collect",
      "How we use it",
      "Children & minors",
      "How we process your data",
      "How long we keep your data",
      "Your rights",
      "Security",
      "Cookies",
      "Changes to this policy",
    ]);
    expect(TERMS_SECTIONS).toHaveLength(13);
  });

  test("always writes the contact address in full", () => {
    const text = `${LEGAL_INTRO} ${allText(PRIVACY_SECTIONS)} ${allText(TERMS_SECTIONS)}`;
    const mentions = text.match(/support@mapmycore[.\w]*/g) ?? [];
    expect(mentions.length).toBeGreaterThan(0);
    for (const mention of mentions) expect(mention.replace(/\.$/, "")).toBe(LEGAL_CONTACT_EMAIL);
  });

  test("has no placeholder or empty section left", () => {
    for (const section of [...PRIVACY_SECTIONS, ...TERMS_SECTIONS]) {
      expect(section.blocks.length).toBeGreaterThan(0);
      expect(allText([section])).not.toMatch(/placeholder|pending|lorem/i);
    }
  });

  test("lists each service provider with a purpose and the data involved", () => {
    const tables = PRIVACY_SECTIONS.flatMap((section) => section.blocks).filter(
      (block): block is { table: { head: readonly string[]; rows: readonly (readonly string[])[] } } =>
        typeof block !== "string" && "table" in block,
    );
    expect(tables).toHaveLength(1);
    for (const row of tables[0].table.rows) expect(row).toHaveLength(tables[0].table.head.length);
  });
});
