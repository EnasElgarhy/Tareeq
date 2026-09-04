import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveCurrentAssessmentId } from "@/lib/results/assessment-identity";
import {
  readResultRegistration,
  writeResultRegistration,
} from "@/lib/results/storage";

const registration = {
  name: "Sara",
  email: "sara@example.com",
  verifiedAt: "2026-09-01T10:00:00.000Z",
  consent: {
    generalResearch: false,
    longitudinalFollowup: false,
    universitySharing: false,
    ageGate: "adult" as const,
    recordedAt: "2026-09-01T10:00:00.000Z",
    consentVersion: "v1" as const,
    language: "en" as const,
  },
};

describe("resolveCurrentAssessmentId", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the stored ID without making a repair request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    writeResultRegistration({ ...registration, assessmentId: "stored-id" });

    await expect(resolveCurrentAssessmentId("version-id")).resolves.toBe(
      "stored-id",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("repairs a missing ID from the authenticated current-assessment route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ assessmentId: "server-id" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    writeResultRegistration(registration);

    await expect(resolveCurrentAssessmentId("version-id")).resolves.toBe(
      "server-id",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assessments/current?versionId=version-id",
    );
    expect(readResultRegistration()?.assessmentId).toBe("server-id");
  });

  it("fails open when the server cannot resolve an assessment", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Assessment not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    writeResultRegistration(registration);

    await expect(resolveCurrentAssessmentId("version-id")).resolves.toBeNull();
    expect(readResultRegistration()).not.toHaveProperty("assessmentId");
  });
});
