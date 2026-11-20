import { expect, test } from "@playwright/test";
import { seedCoreStudent, signInFakeStudent } from "./fixtures/core";

/**
 * Delete account: You → Account → Delete account. The student reads what
 * goes, confirms with an emailed code, and the account is deleted.
 */
test.describe("delete account", () => {
  test.beforeEach(async ({ page }) => {
    await signInFakeStudent(page);
    await seedCoreStudent(page);
  });

  test("a student deletes their account after confirming the emailed code", async ({ page }) => {
    let deleteCalls = 0;
    await page.route("**/api/account/delete", (route) => {
      deleteCalls += 1;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ deleted: true }) });
    });

    await page.goto("/you");
    await page.getByRole("link", { name: "Delete account" }).click();
    await expect(page).toHaveURL(/\/you\/delete$/);
    await expect(page.getByRole("heading", { name: "Delete your account" })).toBeVisible();
    await expect(page.getByText("Payments are not refunded.")).toBeVisible();

    await page.getByRole("button", { name: "Continue to delete" }).click();
    await expect(page.getByRole("heading", { name: "Confirm it's you" })).toBeVisible();
    expect(deleteCalls).toBe(0);

    await page.getByRole("button", { name: "Email me a code" }).click();
    await page.getByLabel("Verification code").fill("123456");
    await page.getByRole("button", { name: "Delete my account" }).click();

    await expect(page.getByRole("heading", { name: "Your account is deleted" })).toBeVisible();
    expect(deleteCalls).toBe(1);
    const leftOver = await page.evaluate(() =>
      Object.keys(window.localStorage).filter((key) => /^tareeq[.:](?!locale|sound)/.test(key)),
    );
    expect(leftOver).toEqual([]);
  });

  test("keeping the account goes back to You and deletes nothing", async ({ page }) => {
    let deleteCalls = 0;
    await page.route("**/api/account/delete", (route) => {
      deleteCalls += 1;
      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/you/delete");
    await page.getByRole("link", { name: "Keep my account" }).click();

    await expect(page).toHaveURL(/\/you#account$/);
    expect(deleteCalls).toBe(0);
  });

  test("a refused deletion keeps the student on the page with a reason", async ({ page }) => {
    await page.route("**/api/account/delete", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "delete_failed" }) }),
    );

    await page.goto("/you/delete");
    await page.getByRole("button", { name: "Continue to delete" }).click();
    await page.getByRole("button", { name: "Email me a code" }).click();
    await page.getByLabel("Verification code").fill("123456");
    await page.getByRole("button", { name: "Delete my account" }).click();

    await expect(page.getByText("We couldn't delete your account.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your account is deleted" })).toHaveCount(0);
  });
});
