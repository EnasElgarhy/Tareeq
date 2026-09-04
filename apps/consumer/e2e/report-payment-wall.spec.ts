import { expect, test, type Page } from "@playwright/test";
import {
  generatedReportStorageKey,
  localeStorageKey,
  makeReport,
  makeResultRegistration,
  resultRegistrationStorageKey,
} from "./fixtures/report";

const assessmentId = "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed";

async function seed(
  page: Page,
  {
    report,
    locale = "en",
    registration = makeResultRegistration({ assessmentId }),
  }: {
    report: Record<string, unknown>;
    locale?: string;
    registration?: Record<string, unknown>;
  },
) {
  await page.addInitScript(
    ({ reportKey, registrationKey, localeKey, seededReport, seededRegistration, seededLocale }) => {
      window.localStorage.setItem(reportKey, JSON.stringify(seededReport));
      window.localStorage.setItem(registrationKey, JSON.stringify(seededRegistration));
      window.localStorage.setItem(localeKey, seededLocale);
    },
    {
      reportKey: generatedReportStorageKey,
      registrationKey: resultRegistrationStorageKey,
      localeKey: localeStorageKey,
      seededReport: report,
      seededRegistration: registration,
      seededLocale: locale,
    },
  );
}

/**
 * Stubs the two payment routes so the paywall can be driven end to end
 * without Stripe or a signed-in Supabase session. The entitlement route is
 * the only thing that decides an unlock, so the stub models exactly that:
 * it answers "none" until the checkout route has been reached, and "active"
 * afterwards — standing in for the webhook.
 */
async function stubPayments(
  page: Page,
  checkout: { status: number; body: Record<string, unknown> },
) {
  let entitled = false;

  await page.route("**/api/payments/checkout-session", async (route) => {
    if (checkout.status === 409) entitled = true;
    await route.fulfill({
      status: checkout.status,
      contentType: "application/json",
      body: JSON.stringify(checkout.body),
    });
  });

  await page.route("**/api/payments/entitlement*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        entitled
          ? { status: "active", unlockedAt: "2026-07-28T12:05:00.000Z" }
          : { status: "none" },
      ),
    });
  });
}

test("previews a report and unlocks only once the server confirms it", async ({ page }) => {
  const report = makeReport({
    generatedAt: "2026-07-28T12:00:00.000Z",
    headline: "The Strategic Creator",
    summary:
      "You combine analytical thinking with a desire to build and create meaningful outcomes.",
    careerLandscape:
      "Your responses point toward product, technology, and innovation roles where ideas become useful experiences.",
  });

  await seed(page, { report });
  // 409 `already_owned` is the server reporting an entitlement it already
  // holds: the correct outcome is an unlock, never a second charge.
  await stubPayments(page, { status: 409, body: { error: "already_owned" } });

  await page.goto("/results");
  await expect(page.getByRole("heading", { name: "The Strategic Creator" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your complete report" })).toBeVisible();
  await expect(page.getByText("Top career matches")).toBeVisible();

  await page.getByRole("button", { name: "Unlock my full report" }).click();
  await expect(page.getByRole("dialog", { name: "Unlock your complete report" })).toBeVisible();

  await expect(page.getByText("Your complete report is unlocked")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Business", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/results$/);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Your complete report is unlocked")).toBeVisible();
  await expect(page.getByRole("button", { name: "Unlock my full report" })).toHaveCount(0);
});

test("relocks a report the server has no entitlement for", async ({ page }) => {
  await seed(page, {
    report: makeReport({ generatedAt: "2026-07-28T15:00:00.000Z" }),
  });
  await stubPayments(page, { status: 502, body: { error: "checkout_unavailable" } });

  // A forged local unlock. The entitlement route answers "none", so the
  // cache must be corrected rather than believed.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "tareeq.report.access.v1:core-20260728T150000000Z",
      JSON.stringify({
        reportId: "core-20260728T150000000Z",
        status: "unlocked",
        isPaid: true,
        paymentId: "forged",
        updatedAt: "2026-07-28T15:00:00.000Z",
      }),
    );
  });

  await page.goto("/results");
  await expect(page.getByRole("heading", { name: "Your complete report" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Unlock my full report" })).toBeVisible();
  await expect(page.getByText("Your complete report is unlocked")).toHaveCount(0);
});

test("shows a recoverable failure when checkout cannot open", async ({ page }) => {
  await seed(page, {
    report: makeReport({ generatedAt: "2026-07-28T13:00:00.000Z" }),
  });
  await stubPayments(page, { status: 502, body: { error: "checkout_unavailable" } });

  await page.goto("/results");
  await page.getByRole("button", { name: "Unlock my full report" }).click();

  await expect(
    page.getByText("We couldn't reach the payment service. Check your connection and try again."),
  ).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Unlock your complete report" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("is RTL-safe on a 390px Arabic viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, {
    locale: "ar",
    registration: makeResultRegistration(),
    report: makeReport({
      generatedAt: "2026-07-28T14:00:00.000Z",
      headline: "المبدع الاستراتيجي",
      summary: "تجمع بين التفكير التحليلي والرغبة في بناء نتائج ذات معنى.",
      careerLandscape: "تشير إجاباتك إلى مسارات تجمع بين الابتكار والتقنية وبناء المنتجات.",
    }),
  });

  await page.goto("/results");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("button", { name: "افتح التقرير" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "المبدع الاستراتيجي" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
