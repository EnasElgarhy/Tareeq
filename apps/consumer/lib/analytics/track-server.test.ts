// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ upsert: vi.fn(), from: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ from: mocks.from }),
}));

import { trackServerEvent } from "./track-server";

describe("trackServerEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ upsert: mocks.upsert });
    mocks.upsert.mockResolvedValue({ error: null });
  });

  it("writes the event straight to analytics_events with its source labels", async () => {
    await trackServerEvent("payment_succeeded", {
      assessmentId: "33333333-3333-4333-8333-333333333333",
      payer: "parent",
      src: "instagram",
      post: "p2-carousel-03-ar",
    });

    expect(mocks.from).toHaveBeenCalledWith("analytics_events");
    const [rows, options] = mocks.upsert.mock.calls[0];
    expect(options).toEqual({ onConflict: "event_id", ignoreDuplicates: true });
    expect(rows[0]).toMatchObject({
      event_name: "payment_succeeded",
      assessment_id: "33333333-3333-4333-8333-333333333333",
      metadata: { payer: "parent", src: "instagram", post: "p2-carousel-03-ar" },
    });
  });

  it("never throws when the write fails", async () => {
    mocks.upsert.mockResolvedValue({ error: { message: "down" } });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(trackServerEvent("assessment_completed")).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
  });
});
