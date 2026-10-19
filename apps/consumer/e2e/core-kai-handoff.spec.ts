import { expect, test, type Page } from "@playwright/test";
import { seedCoreStudent, signInFakeStudent, stubKaiChat } from "./fixtures/core";

/**
 * The report's "Discuss this with Kai" cards (spec §6.7): a tapped answer or
 * the button must open the Kai chat with the section question as
 * ENTRY_PROMPT and the student's CORE result attached.
 */

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "phone", width: 390, height: 844 },
] as const;

/** The report is a deck: a list of section buttons on desktop, a select on phones. */
async function openReportSection(page: Page, index: number, label: string) {
  const select = page.getByRole("combobox", { name: "Report sections" });
  if (await select.isVisible()) {
    await select.selectOption({ label: `${index}. ${label}` });
  } else {
    await page.getByRole("button", { name: `${index} ${label}` }).click();
  }
}

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await signInFakeStudent(page);
      await seedCoreStudent(page);
    });

    test("a tapped answer opens Kai with the report context", async ({ page }) => {
      const requests = await stubKaiChat(page);
      await page.goto("/compass");
      await openReportSection(page, 3, "Your curiosity");

      const chip = page.locator('a[href*="entry=S3-KAI-Q"][href*="prompt="]').first();
      await chip.scrollIntoViewIfNeeded();
      await expect(chip).toBeVisible();
      const answer = (await chip.innerText()).trim();
      await chip.click();

      await expect(page).toHaveURL(/\/kai$/);
      await expect(page.getByText("That's a great place to start.")).toBeVisible();
      await expect(page.getByRole("paragraph").filter({ hasText: answer })).toBeVisible();
      // CORE students never see the legacy result facts.
      await expect(page.getByText(/archetype|primary cluster/i)).toHaveCount(0);
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({
        kind: "reply",
        message: answer,
        core: {
          entryPromptId: "S3-KAI-Q",
          result: { leadingCuriosities: ["RD"] },
          profile: { gender: "female", ageBand: "13-17" },
        },
      });
    });

    test("Discuss this with Kai opens a conversation Kai starts with the section question", async ({
      page,
    }) => {
      const requests = await stubKaiChat(page, "Which family would you like to know more about?");
      await page.goto("/compass");
      await openReportSection(page, 4, "Where it leads");

      const button = page.locator('a[href*="entry=S4-KAI-Q"]:not([href*="prompt="])').first();
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeVisible();
      await button.click();

      await expect(page).toHaveURL(/\/kai$/);
      await expect(page.getByText("Which family would you like to know more about?")).toBeVisible();
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({ kind: "open", core: { entryPromptId: "S4-KAI-Q" } });
      expect(requests[0].message).toBeUndefined();
    });
  });
}
