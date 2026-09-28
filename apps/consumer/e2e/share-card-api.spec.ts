import { test, expect } from "@playwright/test";

/**
 * Visual regression for the static PNG export (app/api/results/share-card/route.tsx)
 * — no animation, no client JS, so the response bytes are deterministic
 * across runs. Snapshotting the route directly (rather than a browser
 * screenshot) catches Satori/font/RTL regressions without any browser
 * rendering involved.
 */

const BASE_PARAMS = {
  name: "Sara",
  cluster: "BUS",
  archetype: "Catalyst",
  driver: "IMP",
  ecosystem: "High-Energy Team Player",
};

test("renders the English share card as a 1080x1920 PNG", async ({ request }) => {
  const res = await request.get("/api/results/share-card", {
    params: { ...BASE_PARAMS, locale: "en" },
  });
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  expect(await res.body()).toMatchSnapshot("share-card-en.png");
});

test("renders the Arabic share card as a 1080x1920 PNG", async ({ request }) => {
  const res = await request.get("/api/results/share-card", {
    params: { ...BASE_PARAMS, name: "سارة أحمد", locale: "ar", v: "2" },
  });
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  expect(await res.body()).toMatchSnapshot("share-card-ar.png");
});

test("rejects an invalid cluster code", async ({ request }) => {
  const res = await request.get("/api/results/share-card", {
    params: { ...BASE_PARAMS, cluster: "NOPE", locale: "en" },
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toEqual({ error: "Invalid or missing param: cluster" });
});

test("rejects a missing name", async ({ request }) => {
  const res = await request.get("/api/results/share-card", {
    params: { ...BASE_PARAMS, name: "", locale: "en" },
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toEqual({ error: "Missing required param: name" });
});
