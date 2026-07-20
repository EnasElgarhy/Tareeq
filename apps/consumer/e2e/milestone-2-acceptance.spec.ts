import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  generatedReportStorageKey,
  localeStorageKey,
  resultRegistrationStorageKey,
} from "./fixtures/report";

const assessmentStorageKey = "tareeq.assessment.v4";
const evidenceDir = process.env.M2_EVIDENCE_DIR;
const locales = ["en", "ar"] as const;
const totalQuestions = 54;

type GeometryIssue = {
  first: string;
  second?: string;
  reason: "horizontal-cutoff" | "overlap";
};

async function installAssessmentState(page: Page, locale: "en" | "ar") {
  await page.addInitScript(
    ({ assessmentKey, localeKey, selectedLocale }) => {
      window.localStorage.setItem(localeKey, selectedLocale);
      window.localStorage.setItem("tareeq:sound", "off");
      window.localStorage.setItem(
        assessmentKey,
        JSON.stringify({
          assessmentId: "milestone-2-mobile-evidence",
          versionLabel: "v4",
          answers: {},
          currentIndex: 0,
          startedAt: "2026-07-20T00:00:00.000Z",
          updatedAt: "2026-07-20T00:00:00.000Z",
        }),
      );
    },
    {
      assessmentKey: assessmentStorageKey,
      localeKey: localeStorageKey,
      selectedLocale: locale,
    },
  );
}

async function installResultsState(page: Page, locale: "en" | "ar") {
  await page.route("**/api/assessments/share", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: "https://staging.tareek.me/share/milestone-2-evidence",
      }),
    });
  });

  await page.addInitScript(
    ({ localeKey, registrationKey, reportKey, selectedLocale }) => {
      window.localStorage.setItem(localeKey, selectedLocale);
      window.localStorage.setItem("tareeq:sound", "off");
      window.localStorage.setItem(
        registrationKey,
        JSON.stringify({
          name: selectedLocale === "ar" ? "سارة" : "Sara",
          email: "acceptance@example.com",
          verifiedAt: "2026-07-20T00:00:00.000Z",
          consent: {
            generalResearch: false,
            longitudinalFollowup: false,
            universitySharing: false,
            ageGate: "adult",
            recordedAt: "2026-07-20T00:00:00.000Z",
            consentVersion: "v1",
            language: selectedLocale,
          },
        }),
      );
      window.localStorage.setItem(
        reportKey,
        JSON.stringify({
          generatedAt: "2026-07-20T00:00:00.000Z",
          source: "gemini",
          model: "gemini-2.5-flash",
          clusterCode: "BUS",
          clusterName: "Business",
          isMultiCurious: false,
          multiCuriousClusters: [],
          archetype: "Catalyst",
          primaryDriver: "Impact",
          secondaryDriver: "Mastery",
          ecosystemFit: "High-Energy Team Player",
          headline: "Your curiosity points toward Business.",
          summary: "A direction to test, not a box to live inside.",
          academicPath: "Academic path text.",
          careerLandscape: "Career landscape text.",
          integration: "Integration text.",
          realityCheck: "Reality check text.",
          nextSteps: "Next steps text.",
          highSchoolSubjects: ["Business Studies", "Economics"],
          universityMajors: ["Business Administration", "Marketing"],
          careerExamples: ["Product Manager", "Growth Lead"],
          nonObviousPaths: ["Community Builder"],
          score: {
            cluster: {
              TECH: 8,
              ENG: 2,
              SCI: 1,
              ART: 0,
              BUS: 0,
              LAW: 0,
              PPL: 1,
              ENV: 0,
            },
            clusterRaw: {
              TECH: 8,
              ENG: 2,
              SCI: 1,
              ART: 0,
              BUS: 0,
              LAW: 0,
              PPL: 1,
              ENV: 0,
            },
            clusterBonus: {
              TECH: 1,
              ENG: 0,
              SCI: 0,
              ART: 0,
              BUS: 0,
              LAW: 0,
              PPL: 0,
              ENV: 0,
            },
            clusterFinal: {
              TECH: 9,
              ENG: 2,
              SCI: 1,
              ART: 0,
              BUS: 0,
              LAW: 0,
              PPL: 1,
              ENV: 0,
            },
            clusterRankedRaw: [
              ["TECH", 8],
              ["ENG", 2],
              ["PPL", 1],
            ],
            clusterRanked: [
              ["TECH", 9],
              ["ENG", 2],
              ["PPL", 1],
            ],
            topCluster: "TECH",
            primaryClusterScore: 9,
            confidencePercentage: 82,
            confidenceLabel: "High",
            isMultiCurious: false,
            multiCuriousClusters: [],
            archetype: "Catalyst",
            archetypeDesc: "Energizes and mobilizes the people around them.",
            driver: { REC: 1, IMP: 6, AUT: 1, MAS: 2, STA: 0 },
            driverRanked: [
              ["IMP", 6],
              ["MAS", 2],
            ],
            primaryDriver: "IMP",
            secondaryDriver: "MAS",
            primaryDrivers: ["IMP"],
            secondaryDrivers: ["MAS"],
            motivationLabel: "Impact",
            driverNames: {
              REC: "Recognition",
              IMP: "Impact",
              AUT: "Autonomy",
              MAS: "Mastery",
              STA: "Stability",
            },
            ecosystemFit: "High-Energy Team Player",
            socialPos: 70,
            envPos: 60,
            procPos: 40,
            scopePos: 70,
            axes: {
              processing: "FLEX",
              scope: "BROAD",
              social: { collaborative: 2, independent: 1 },
              environment: { dynamic: 2, predictable: 1 },
            },
          },
        }),
      );
    },
    {
      localeKey: localeStorageKey,
      registrationKey: resultRegistrationStorageKey,
      reportKey: generatedReportStorageKey,
      selectedLocale: locale,
    },
  );
}

async function findGeometryIssues(page: Page): Promise<GeometryIssue[]> {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const selector =
      "button, input, textarea, select, a[href], [role='dialog'], #question-text";
    const activeDialog = Array.from(
      document.querySelectorAll("[role='dialog']"),
    ).find((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0
      );
    });
    const candidateSource = activeDialog
      ? [activeDialog, ...Array.from(activeDialog.querySelectorAll(selector))]
      : Array.from(document.querySelectorAll(selector));
    const candidates = candidateSource.filter(
      (element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          rect.width > 0 &&
          rect.height > 0
        );
      },
    );

    const describe = (element: Element) =>
      element.getAttribute("aria-label") ||
      (element as HTMLElement).innerText
        ?.trim()
        .replace(/\s+/g, " ")
        .slice(0, 80) ||
      element.id ||
      element.tagName.toLowerCase();

    const issues: GeometryIssue[] = [];
    for (const element of candidates) {
      const rect = element.getBoundingClientRect();
      if (rect.left < -1 || rect.right > viewportWidth + 1) {
        issues.push({
          first: describe(element),
          reason: "horizontal-cutoff",
        });
      }
    }

    const visibleControls = candidates.filter((element) => {
      if (element.matches("[role='dialog'], #question-text")) return false;
      if (element.matches(".anim-backdrop-fade")) return false;
      const rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < viewportHeight;
    });

    for (let firstIndex = 0; firstIndex < visibleControls.length; firstIndex++) {
      const first = visibleControls[firstIndex]!;
      const firstRect = first.getBoundingClientRect();

      for (
        let secondIndex = firstIndex + 1;
        secondIndex < visibleControls.length;
        secondIndex++
      ) {
        const second = visibleControls[secondIndex]!;
        if (first.contains(second) || second.contains(first)) continue;

        const secondRect = second.getBoundingClientRect();
        const overlapWidth =
          Math.min(firstRect.right, secondRect.right) -
          Math.max(firstRect.left, secondRect.left);
        const overlapHeight =
          Math.min(firstRect.bottom, secondRect.bottom) -
          Math.max(firstRect.top, secondRect.top);

        if (overlapWidth > 2 && overlapHeight > 2) {
          issues.push({
            first: describe(first),
            second: describe(second),
            reason: "overlap",
          });
        }
      }
    }

    return issues;
  });
}

async function expectCleanGeometry(page: Page, context: string) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(await findGeometryIssues(page), context).toEqual([]);
}

async function captureEvidence(
  page: Page,
  testInfo: TestInfo,
  filename: string,
) {
  const screenshot = await page.screenshot();
  await testInfo.attach(filename, {
    body: screenshot,
    contentType: "image/png",
  });

  if (!evidenceDir) return;
  await mkdir(evidenceDir, { recursive: true });
  await page.screenshot({
    path: path.join(evidenceDir, `${testInfo.project.name}-${filename}`),
  });
}

for (const locale of locales) {
  test(`${locale}: assessment start and all 54 questions fit mobile`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await installAssessmentState(page, locale);

    await page.goto("/start");
    await expect(page.locator("#start-heading")).toBeVisible();
    await expectCleanGeometry(page, `${locale} /start`);
    await captureEvidence(page, testInfo, `${locale}-start.png`);

    for (let index = 0; index < totalQuestions; index++) {
      await page.goto(`/q/${index}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#question-text")).toBeVisible();
      await expectCleanGeometry(page, `${locale} /q/${index}`);

      if (index === 0 || index === 29 || index === totalQuestions - 1) {
        await captureEvidence(page, testInfo, `${locale}-q-${index}.png`);
      }
    }
  });

  test(`${locale}: result and designed share card fit mobile`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await installResultsState(page, locale);
    await page.goto("/results");

    const shareButton = page.getByRole("button", {
      name: locale === "ar" ? "شارك النتيجة" : "Share result",
    });
    await expect(shareButton).toBeVisible();
    await expectCleanGeometry(page, `${locale} /results`);
    await captureEvidence(page, testInfo, `${locale}-results.png`);

    await shareButton.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expectCleanGeometry(page, `${locale} share dialog`);
    await captureEvidence(page, testInfo, `${locale}-share-card.png`);
  });
}
