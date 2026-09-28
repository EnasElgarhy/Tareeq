import { test, expect } from "@playwright/test";
import {
  generatedReportStorageKey,
  localeStorageKey,
  makeReport,
  makeResultRegistration,
  makeUnlockedAccess,
  reportAccessStoragePrefix,
  resultRegistrationStorageKey,
} from "./fixtures/report";

/**
 * Critical-flow test for the shareable Compass Card: seeds the same
 * localStorage contract lib/results/storage.ts reads (no auth/DB needed —
 * the Compass tab is a pure client read of these keys, plus the unlocked
 * access record that opens the complete report), then drives the real
 * CompassReportView -> ShareCardModal -> CompassCard flow. /api/assessments/share
 * is mocked so the run never writes to the real backend; the PNG-export
 * endpoint (/api/results/share-card) is hit for real — it's a stateless
 * render.
 */

const report = makeReport();
const reportIdOf = (r: { generatedAt: string }) =>
  `core-${r.generatedAt.replace(/[^a-zA-Z0-9]/g, "")}`;

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
  // the redirects the app issues when a key is absent.
  await page.goto("/");
  await page.evaluate(
    ({
      regKey,
      reportKey,
      localeKey,
      accessKey,
      registration,
      report,
      access,
    }) => {
      window.localStorage.setItem(regKey, JSON.stringify(registration));
      window.localStorage.setItem(reportKey, JSON.stringify(report));
      window.localStorage.setItem(accessKey, JSON.stringify(access));
      // Skip the (assessment)/(app) layouts' LanguageGate — it otherwise
      // intercepts every route behind those layouts (including /results)
      // until a language is explicitly chosen.
      window.localStorage.setItem(localeKey, "en");
    },
    {
      regKey: resultRegistrationStorageKey,
      reportKey: generatedReportStorageKey,
      localeKey: localeStorageKey,
      accessKey: reportAccessStoragePrefix + reportIdOf(report),
      registration: makeResultRegistration(),
      report,
      access: makeUnlockedAccess(report.generatedAt),
    },
  );
});

test("opens the Compass Card share modal from the results screen", async ({
  page,
}) => {
  await page.goto("/compass");

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
  await page.goto("/compass");
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

test("the modal fits inside a 375px-wide viewport without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/compass");
  await page.getByRole("button", { name: "Share result" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
});

test("Compass Card visual regression (reduced motion — end state)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass");
  await page.getByRole("button", { name: "Share result" }).click();

  const card = page.locator(".compass-card");
  await expect(card).toBeVisible();
  await expect(card).toHaveScreenshot("compass-card-live-en.png");
});

test("Arabic Compass Card keeps connected glyphs in the live preview", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    ({ regKey, localeKey }) => {
      const registration = JSON.parse(
        window.localStorage.getItem(regKey) ?? "{}",
      ) as Record<string, unknown>;
      window.localStorage.setItem(
        regKey,
        JSON.stringify({ ...registration, name: "سارة أحمد" }),
      );
      window.localStorage.setItem(localeKey, "ar");
    },
    {
      regKey: resultRegistrationStorageKey,
      localeKey: localeStorageKey,
    },
  );

  await page.goto("/compass");
  await page.getByRole("button", { name: "شارك النتيجة" }).click();

  const card = page.locator(".compass-card");
  await expect(card).toBeVisible();
  await expect(card.locator(".compass-card-eyebrow")).toHaveCSS(
    "letter-spacing",
    "normal",
  );
  await expect(card.locator(".compass-card-archetype")).toHaveCSS(
    "font-style",
    "normal",
  );
  await expect(card).toHaveScreenshot("compass-card-live-ar.png");
});
