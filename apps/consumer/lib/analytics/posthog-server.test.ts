// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { capturePostHogServerEvent } from "@/lib/analytics/posthog-server";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com/");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("capturePostHogServerEvent", () => {
  test("posts the event to the EU capture endpoint with the anonymous ID", async () => {
    await capturePostHogServerEvent("report_paid", "attempt_abc", { paid_by: "parent", amount_aed: 360 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://eu.i.posthog.com/i/v0/e/");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      api_key: "phc_test",
      event: "report_paid",
      distinct_id: "attempt_abc",
      properties: { paid_by: "parent", amount_aed: 360, $geoip_disable: true },
    });
  });

  test("sends nothing when PostHog is switched off", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_ENABLED", "false");
    await capturePostHogServerEvent("report_paid", "attempt_abc", {});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("sends nothing when no project key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    await capturePostHogServerEvent("report_paid", "attempt_abc", {});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("never throws when PostHog cannot be reached", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(capturePostHogServerEvent("report_paid", "attempt_abc", {})).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });
});
