import { describe, expect, it } from "vitest";
import {
  buildVersionGenerations,
  classifyAttempt,
  classifyVersion,
  CORE_VERSION_LABEL,
  filterAttemptsByGeneration,
  isGenerationWritable,
  versionIdsOf,
} from "@/lib/admin/assessment-generation";

const versions = buildVersionGenerations([
  { id: "v4-live", label: "v4 (2026-06)", catalog_id: null },
  { id: "v4-draft", label: "v4 (2026-06) (draft)", catalog_id: null },
  { id: "core", label: CORE_VERSION_LABEL, catalog_id: null },
  { id: "custom", label: "Team survey", catalog_id: "cat-1" },
]);

const attempts = [
  { id: "a1", version_id: "v4-live", result: { archetype: "Builder" } },
  { id: "a2", version_id: "v4-live", scoring_version: "1.x", result: null },
  {
    id: "a3",
    version_id: "core",
    scoring_version: "1.x",
    result: { scoringVersion: "2.0" },
  },
  { id: "a4", version_id: "core", result: null },
  { id: "a5", version_id: "custom", result: { profile: "x" } },
  // A CORE result filed under a v4 version must still never count as v4.
  { id: "a6", version_id: "v4-live", result: { scoringVersion: "2.0" } },
  { id: "a7", version_id: "v4-live", scoring_version: "2.0", result: null },
  { id: "a8", version_id: "deleted-version", result: null },
];

describe("classifyVersion", () => {
  it("puts the CORE label row in CORE 2.0, other non-catalog rows in v4", () => {
    expect(classifyVersion({ id: "x", label: CORE_VERSION_LABEL })).toBe(
      "core-2.0",
    );
    expect(classifyVersion({ id: "x", label: "v4" })).toBe("legacy-v4");
    expect(classifyVersion({ id: "x", label: "v4", catalog_id: null })).toBe(
      "legacy-v4",
    );
  });

  it("treats any catalog-linked version as custom, even with the CORE label", () => {
    expect(
      classifyVersion({ id: "x", label: CORE_VERSION_LABEL, catalog_id: "c" }),
    ).toBe("custom");
  });
});

describe("classifyAttempt", () => {
  it("classifies by version row when the result carries no marker", () => {
    expect(classifyAttempt(attempts[0], versions)).toBe("legacy-v4");
    expect(classifyAttempt(attempts[3], versions)).toBe("core-2.0");
    expect(classifyAttempt(attempts[4], versions)).toBe("custom");
  });

  it("ignores the column default '1.x' on CORE rows", () => {
    expect(classifyAttempt(attempts[2], versions)).toBe("core-2.0");
  });

  it("never treats a 2.0-scored attempt as v4", () => {
    expect(classifyAttempt(attempts[5], versions)).toBe("core-2.0");
    expect(classifyAttempt(attempts[6], versions)).toBe("core-2.0");
  });

  it("returns null for attempts whose version is unknown", () => {
    expect(classifyAttempt(attempts[7], versions)).toBeNull();
  });
});

describe("filterAttemptsByGeneration", () => {
  it("splits attempts into disjoint sets", () => {
    const core = filterAttemptsByGeneration(attempts, versions, "core-2.0");
    const v4 = filterAttemptsByGeneration(attempts, versions, "legacy-v4");
    const custom = filterAttemptsByGeneration(attempts, versions, "custom");

    expect(core.map((a) => a.id)).toEqual(["a3", "a4", "a6", "a7"]);
    expect(v4.map((a) => a.id)).toEqual(["a1", "a2"]);
    expect(custom.map((a) => a.id)).toEqual(["a5"]);

    const ids = [...core, ...v4, ...custom].map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("versionIdsOf", () => {
  it("lists the version ids of one generation", () => {
    expect(versionIdsOf(versions, "legacy-v4")).toEqual([
      "v4-live",
      "v4-draft",
    ]);
    expect(versionIdsOf(versions, "core-2.0")).toEqual(["core"]);
  });
});

describe("isGenerationWritable", () => {
  it("locks v4 and CORE 2.0 out of the v4 editor", () => {
    expect(isGenerationWritable("legacy-v4")).toBe(false);
    expect(isGenerationWritable("core-2.0")).toBe(false);
    expect(isGenerationWritable("custom")).toBe(true);
  });
});
