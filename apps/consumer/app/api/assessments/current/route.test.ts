import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eqUser: vi.fn(),
  eqVersion: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  })),
}));

import { GET } from "@/app/api/assessments/current/route";

describe("GET /api/assessments/current", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ eq: mocks.eqUser });
    mocks.eqUser.mockReturnValue({ eq: mocks.eqVersion });
    mocks.eqVersion.mockReturnValue({ order: mocks.order });
    mocks.order.mockReturnValue({ limit: mocks.limit });
    mocks.limit.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  });

  it("requires authentication", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await GET(
      new Request("http://localhost/api/assessments/current?versionId=v4-id"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Not authenticated.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns the caller's latest assessment ID for the requested version", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-id" } } });
    mocks.maybeSingle.mockResolvedValue({
      data: { id: "assessment-id" },
      error: null,
    });

    const response = await GET(
      new Request("http://localhost/api/assessments/current?versionId=v4-id"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      assessmentId: "assessment-id",
    });
    expect(mocks.eqUser).toHaveBeenCalledWith("user_id", "user-id");
    expect(mocks.eqVersion).toHaveBeenCalledWith("version_id", "v4-id");
  });

  it("returns 404 when the caller has no assessment for that version", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-id" } } });
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await GET(
      new Request("http://localhost/api/assessments/current?versionId=v4-id"),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Assessment not found.",
    });
  });
});
