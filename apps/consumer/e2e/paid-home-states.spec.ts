import { expect, test } from "@playwright/test";
import { seedCoreStudent, signInFakeStudent } from "./fixtures/core";

/**
 * 20 Nov corrections, item 1: a student who has paid for a CORE 2.0 report
 * must be sent to the report, never told to take CORE again.
 */
test.describe("paid CORE student on Overview and You", () => {
  test.beforeEach(async ({ page }) => {
    await signInFakeStudent(page);
    await seedCoreStudent(page);
  });

  test("Overview shows the CORE overview and opens the report", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByRole("heading", { name: "Research & Discovery" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Job families to explore" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your next steps" })).toBeVisible();
    await expect(page.getByText("Start your CORE")).toHaveCount(0);
    const open = page.getByRole("link", { name: /Open your CORE report/ });
    await expect(open).toHaveAttribute("href", "/compass");
  });

  test("You shows when the report was taken", async ({ page }) => {
    await page.goto("/you");
    await expect(page.getByRole("heading", { name: "Your CORE report", exact: true })).toBeVisible();
    await expect(page.getByText("Taken on 18 October 2026. Open it any time.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open your CORE report" })).toHaveAttribute("href", "/compass");
  });
});
