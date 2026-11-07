import { expect, test, type Page } from "@playwright/test";
import { E2E_EMAIL, mockSupabase, stubKaiChat } from "./fixtures/core";
import { localeStorageKey } from "./fixtures/report";

/**
 * A new student's whole CORE journey through the real UI: start, About you,
 * the 46 CORE questions with their part intros, the end screen, email-code
 * sign-in, the paywall, the
 * report, and Kai from the report. Only the network edges are stubbed:
 * Supabase auth/REST, the persist and payment routes that need a real
 * server session, and Kai's model call.
 */

const QUESTION_COUNT = 50;
/** Buttons a journey must not tap: controls, and Under 13, which ends it. */
const CONTROLS = /Unmute|Replay|Playback|Previous|^Next$|Go back|Kai's voice|^Under 13$/i;

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
    // The screens between stages: the dividing page and each part's intro.
    if (page.url().endsWith("/done")) return seen.size;
    const between = page.getByRole("button", { name: /^(Start|Continue)$/ });
    if (/\/(begin|part\/\d)$/.test(page.url()) && (await between.isVisible())) {
      await between.click({ timeout: 5_000 }).catch(() => undefined);
      continue;
    }
    const url = page.url();
    if (!/\/q\/\d+/.test(url)) continue;
    // No option may look chosen before the student touches one.
    if (!seen.has(url)) {
      await expect(page.locator('button.assessment-answer[data-active="true"]')).toHaveCount(0);
    }
    seen.add(url);

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
      await page.getByRole("button", { name: "Prefer not to say" }).click({ timeout: 5_000 });
      await page.getByRole("button", { name: "Next", exact: true }).click({ timeout: 5_000 });
      continue;
    }
    const options = [];
    for (const button of await page.getByRole("region").last().getByRole("button").all()) {
      const name = (await button.getAttribute("aria-label")) ?? (await button.innerText());
      if (!CONTROLS.test(name.trim()) && (await button.isEnabled())) options.push(button);
    }
    // Wait for what the tap causes before looking again: .all() locators go by
    // position, so a second tap mid-move would land on the next screen unchecked.
    if (page.url() !== url || options.length === 0) continue;
    await options[step % options.length].click({ timeout: 5_000 }).catch(() => undefined);
    await Promise.race([
      page.waitForURL((next) => next.href !== url, { timeout: 2_000 }),
      reread.waitFor({ state: "visible", timeout: 2_000 }),
    ]).catch(() => undefined);
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
  await page.getByRole("button", { name: "I'm ready" }).click();
  await page.waitForURL(/\/about-you$/);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/q\/0$/);
  // About you stands apart: no counter, no MY CORE bar.
  await expect(page.getByText("/ 46")).toHaveCount(0);
  await expect(page.getByText("My CORE", { exact: true })).toHaveCount(0);

  // Every question, through the real answer buttons.
  expect(await answerAllQuestions(page)).toBe(QUESTION_COUNT);
  await page.waitForURL(/\/done$/);
  await expect(page.getByText("All done! Your results are ready to unlock.")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/register$/);
  await expect(page.getByText("We never share your email.")).toBeVisible();

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
    answers: { QD2: "Jordan", QD2b: "QD2b-X" },
  });
  expect(Object.keys(backend.persisted[0].optionOrder as object)).toHaveLength(46);

  await page.getByRole("radio", { name: /^Me/ }).click({ timeout: 15_000 });
  const unlock = page.getByRole("button", { name: /unlock|pay/i }).first();
  await expect(unlock).toBeEnabled();
  await unlock.click();
  // The order summary, then checkout (stubbed above as already owned).
  await page.getByRole("button", { name: /^Unlock for AED/ }).click();
  await expect(page.getByRole("combobox", { name: "Report sections" }).or(
    page.getByRole("navigation", { name: "Report sections" }),
  )).toBeVisible({ timeout: 15_000 });

  // Kai from the report, with the student's CORE result attached.
  await page.getByRole("button", { name: /^\d Your curiosity$/ }).click();
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

test("a student under 13 is stopped and nothing is kept", async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "en");
    window.localStorage.setItem("tareeq:sound", "off");
  }, localeStorageKey);

  await page.goto("/start");
  await page.locator("label:has(input[type=checkbox])").first().click();
  await page.getByRole("button", { name: "Begin" }).click();
  await page.waitForURL(/\/intro$/);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/contract$/);
  await page.getByRole("button", { name: "I'm ready" }).click();
  await page.waitForURL(/\/about-you$/);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/q\/0$/);
  await page.getByRole("button", { name: "Under 13" }).click();

  await page.waitForURL(/\/stop$/);
  await expect(page.getByText("Nothing you entered has been saved.")).toBeVisible();
  const kept = await page.evaluate(() => JSON.stringify(window.localStorage));
  expect(kept).not.toContain("AGE-U13");
});
