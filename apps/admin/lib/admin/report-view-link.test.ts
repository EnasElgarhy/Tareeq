// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  consumerOriginFor,
  reportViewUrl,
  signReportView,
} from "./report-view-link";

const SECRET = "service-role-key-for-tests";
const ID = "0b6f9a3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
const NOW = 1_794_000_000;

describe("report view links", () => {
  it("signs exactly like the student site", () => {
    // Same vector as apps/consumer/lib/report-view/signature.test.ts.
    expect(signReportView(ID, NOW + 600, SECRET)).toBe(
      "8d8c936d421250ecba4ba2e636a5f5128ac7b47de326e8f91f01dc2961b7dd7c",
    );
  });

  it("points each admin at its own student site", () => {
    expect(consumerOriginFor("admin-staging.mapmycore.com")).toBe(
      "https://staging.mapmycore.com",
    );
    expect(consumerOriginFor("admin.mapmycore.com")).toBe(
      "https://mapmycore.com",
    );
    expect(consumerOriginFor("localhost:3001")).toBe("http://localhost:3000");
  });

  it("prefers a configured student site", () => {
    expect(
      consumerOriginFor("admin.mapmycore.com", "https://example.test/"),
    ).toBe("https://example.test");
  });

  it("has no student site for an unknown host", () => {
    expect(consumerOriginFor("evil.example")).toBeNull();
  });

  it("builds a link that lasts ten minutes", () => {
    const url = new URL(
      reportViewUrl(ID, "https://staging.mapmycore.com", NOW, SECRET),
    );
    expect(url.origin + url.pathname).toBe(
      `https://staging.mapmycore.com/report-view/${ID}`,
    );
    expect(url.searchParams.get("exp")).toBe(String(NOW + 600));
    expect(url.searchParams.get("sig")).toBe(
      signReportView(ID, NOW + 600, SECRET),
    );
  });
});
