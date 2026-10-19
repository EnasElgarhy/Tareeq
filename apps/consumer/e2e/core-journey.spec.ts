import { expect, test, type Page } from "@playwright/test";
import { E2E_EMAIL, mockSupabase, stubKaiChat } from "./fixtures/core";
import { localeStorageKey } from "./fixtures/report";

/**
 * A new student's whole CORE journey through the real UI: start, the 50
 * questions (4 background + 46 CORE), email-code sign-in, the paywall, the
 * report, and Kai from the report. Only the network edges are stubbed:
 * Supabase auth/REST, the persist and payment routes that need a real
 * server session, and Kai's model call.
 */

const QUESTION_COUNT = 50;
/** Buttons on a question screen that are not answers. */
const CONTROLS = /Unmute|Replay|Playback|Previous|^Next$|Go back|Kai's voice/i;

async function stubBackend(page: Page) {
  const persisted: Array<Record<string, unknown>> = [];
  await page.route("**/api/assessments/persist", async (route) => {
    persisted.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ assessmentId: "e2e-core-assessment" }),
    });
  });
  // Stands in for Stripe and its webhook: nothing is owned until checkout
  // is reached, and checkout then reports the report as already owned.
  let isOwned = false;
  await page.route("**/api/payments/checkout-session", async (route) => {
    isOwned = true;
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ error: "already_owned" }),
    });
  });
  await page.route("**/api/payments/entitlement*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        isOwned ? { status: "active", unlockedAt: new Date().toISOString() } : { status: "none" },
      ),
    }),
  );
  return { persisted };
}

/** Answers every question as a student would, including the reading-pace sheet and Kai's breaks. */
async function answerAllQuestions(page: Page) {
  const seen = new Set<string>();
  for (let step = 0; step < QUESTION_COUNT * 6 && !page.url().endsWith("/register"); step++) {
    await page.waitForTimeout(300);
    if (!/\/q\/\d+/.test(page.url())) continue;
    seen.add(page.url());

    const kaiBreak = page.locator('.assessment-night[aria-hidden="false"] .assessment-primary-action').first();
    if (await kaiBreak.isVisible()) {
      await kaiBreak.click({ timeout: 5_000 });
      continue;
    }
    // A tap before the question could be read opens the pace sheet.
    const reread = page.getByRole("button", { name: "Let me read again" }).last();
    if (await reread.isVisible()) {
      await reread.click({ timeout: 5_000 });
      continue;
    }
    const country = page.getByRole("combobox");
    if (await country.isVisible()) {
      await country.selectOption({ label: "Jordan" });
      await page.getByRole("button", { name: "Next", exact: true }).click({ timeout: 5_000 });
      continue;
    }
    const options = [];
    for (const button of await page.getByRole("region").last().getByRole("button").all()) {
      const name = (await button.getAttribute("aria-label")) ?? (await button.innerText());
      if (!CONTROLS.test(name.trim()) && (await button.isEnabled())) options.push(button);
    }
    // An option can detach mid-tap while the screen moves on; the next pass
    // re-reads whatever screen is showing.
    if (options.length > 0) {
      await options[step % options.length].click({ timeout: 5_000 }).catch(() => undefined);
    }
  }
  return seen.size;
}

test("a new student goes from start to a Kai conversation about their CORE report", async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "en");
    window.localStorage.setItem("tareeq:sound", "off");
  }, localeStorageKey);
  const supabase = await mockSupabase(page);
  const backend = await stubBackend(page);
  const kaiRequests = await stubKaiChat(page, "Which of these curiosities feels most like you?");

  // Start, Kai's intro and the contract.
  await page.goto("/start");
  await page.locator("label:has(input[type=checkbox])").first().click();
  await page.getByRole("button", { name: "Begin" }).click();
  await page.waitForURL(/\/intro$/);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/contract$/);
  await page.getByRole("button", { name: "I agree, begin" }).click();
  await page.waitForURL(/\/q\/0$/);
  await expect(page.getByText(`01 / ${QUESTION_COUNT}`)).toBeVisible();

  // Every question, through the real answer buttons.
  expect(await answerAllQuestions(page)).toBe(QUESTION_COUNT);
  await page.waitForURL(/\/register$/);

  // Email-code sign-in.
  await page.getByRole("textbox", { name: "Name" }).fill("Sara");
  await page.getByRole("textbox", { name: "Email address" }).fill(E2E_EMAIL);
  await page.getByRole("button", { name: "Send verification code" }).click();
  await page.getByRole("textbox", { name: "Verification code" }).fill("123456");
  await page.getByRole("button", { name: "Verify and analyze" }).click();
  expect(supabase.codesSentTo).toEqual([E2E_EMAIL]);

  // The CORE result is saved to the account, then the report opens locked.
  await page.waitForURL(/\/compass$/, { timeout: 30_000 });
  expect(backend.persisted).toHaveLength(1);
  expect(backend.persisted[0]).toMatchObject({
    result: { scoringVersion: "2.0" },
    answers: { QD2: "Jordan" },
  });

  const unlock = page.getByRole("button", { name: /unlock/i }).first();
  await expect(unlock).toBeVisible({ timeout: 15_000 });
  await unlock.click();
  await expect(page.getByRole("combobox", { name: "Report sections" }).or(
    page.getByRole("navigation", { name: "Report sections" }),
  )).toBeVisible({ timeout: 15_000 });

  // Kai from the report, with the student's CORE result attached.
  await page.getByRole("button", { name: "3 Your curiosity" }).click();
  const discuss = page.locator('a[href*="entry=S3-KAI-Q"]:not([href*="prompt="])').first();
  await discuss.scrollIntoViewIfNeeded();
  await discuss.click();
  await page.waitForURL(/\/kai$/);
  await expect(page.getByText("Which of these curiosities feels most like you?")).toBeVisible();
  expect(kaiRequests).toHaveLength(1);
  expect(kaiRequests[0]).toMatchObject({
    kind: "open",
    core: {
      entryPromptId: "S3-KAI-Q",
      result: { scoringVersion: "2.0" },
      profile: { country: "Jordan" },
    },
  });
});
