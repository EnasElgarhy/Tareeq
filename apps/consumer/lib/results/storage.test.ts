import { beforeEach, describe, expect, it } from "vitest";
import {
  readResultRegistration,
  resultRegistrationStorageKey,
} from "@/lib/results/storage";

const storedRegistration = {
  name: "Sara",
  email: "sara@example.com",
  verifiedAt: "2026-09-01T10:00:00.000Z",
  consent: {
    generalResearch: false,
    longitudinalFollowup: false,
    universitySharing: false,
    ageGate: "adult",
    recordedAt: "2026-09-01T10:00:00.000Z",
    consentVersion: "v1",
    language: "en",
  },
};

describe("result registration storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("continues to read records saved before assessment IDs were stored", () => {
    window.localStorage.setItem(
      resultRegistrationStorageKey,
      JSON.stringify(storedRegistration),
    );

    const registration = readResultRegistration();

    expect(registration).toMatchObject(storedRegistration);
    expect(registration).not.toHaveProperty("assessmentId");
  });

  it("preserves a valid server assessment ID", () => {
    window.localStorage.setItem(
      resultRegistrationStorageKey,
      JSON.stringify({
        ...storedRegistration,
        assessmentId: "9f61816f-8616-4c84-b19f-23c67be0f8eb",
      }),
    );

    expect(readResultRegistration()).toMatchObject({
      ...storedRegistration,
      assessmentId: "9f61816f-8616-4c84-b19f-23c67be0f8eb",
    });
  });

  it("ignores an invalid optional assessment ID without rejecting the record", () => {
    window.localStorage.setItem(
      resultRegistrationStorageKey,
      JSON.stringify({ ...storedRegistration, assessmentId: 42 }),
    );

    const registration = readResultRegistration();

    expect(registration).toMatchObject(storedRegistration);
    expect(registration).not.toHaveProperty("assessmentId");
  });
});
