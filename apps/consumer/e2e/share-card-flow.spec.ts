import { test, expect } from "@playwright/test";
import {
  generatedReportStorageKey,
  localeStorageKey,
  makeReport,
  makeResultRegistration,
  resultRegistrationStorageKey,
} from "./fixtures/report";

/**
 * Critical-flow test for the shareable Compass Card: seeds the same
 * localStorage contract lib/results/storage.ts reads (no auth/DB needed —
 * /results is a pure client read of these two keys), then drives the real
 * ResultsScreen -> ShareCardModal -> CompassCard flow. /api/assessments/share
 * is mocked so the run never writes to the real backend; the PNG-export
 * endpoint (/api/results/share-card) is hit for real — it's a stateless
 * render.
 */

test.beforeEach(async ({ page }) => {
  await page.route("**/api/assessments/share", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ url: "https://tareeq.app/share/e2e-test-token" }),
    });
  });

  // Seed localStorage on the app's origin before the SPA's mount effect
  // reads it — a bare navigation establishes the origin without tripping
  // the /register or /analyzing redirects ResultsScreen issues when either
  // key is absent.
  await page.goto("/");
  await page.evaluate(
    ({ regKey, reportKey, localeKey, registration, report }) => {
      window.localStorage.setItem(regKey, JSON.stringify(registration));
      window.localStorage.setItem(reportKey, JSON.stringify(report));
      // Skip the (assessment)/(app) layouts' LanguageGate — it otherwise
      // intercepts every route behind those layouts (including /results)
      // until a language is explicitly chosen.
      window.localStorage.setItem(localeKey, "en");
    },
    {
      regKey: resultRegistrationStorageKey,
      reportKey: generatedReportStorageKey,
      localeKey: localeStorageKey,
      registration: makeResultRegistration(),
      report: makeReport(),
    },
  );
});

test("opens the Compass Card share modal from the results screen", async ({ page }) => {
  await page.goto("/results");

  await page.getByRole("button", { name: "Share result" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("SARA", { exact: false })).toBeVisible();
  await expect(dialog.getByText("Catalyst")).toBeVisible();
});

test("shares the card via the download fallback (no Web Share support in headless Chromium)", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-write"]);
  await page.goto("/results");
  await page.getByRole("button", { name: "Share result" }).click();

  const dialog = page.getByRole("dialog");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    dialog.getByRole("button", { name: "Share your compass" }).click(),
  ]);

  expect(download.suggestedFilename()).toBe("tareeq-compass.png");
  const path = await download.path();
  expect(path).toBeTruthy();

  await expect(dialog.getByText("Image saved and link copied.")).toBeVisible();
});

test("the modal fits inside a 375px-wide viewport without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/results");
  await page.getByRole("button", { name: "Share result" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
});

test("Compass Card visual regression (reduced motion — end state)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/results");
  await page.getByRole("button", { name: "Share result" }).click();

  const card = page.locator(".compass-card");
  await expect(card).toBeVisible();
  await expect(card).toHaveScreenshot("compass-card-live-en.png");
});
