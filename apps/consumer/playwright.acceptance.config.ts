import { defineConfig } from "@playwright/test";

const mobileViewport = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
};

export default defineConfig({
  testDir: "./e2e",
  testMatch: "milestone-2-acceptance.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 180_000,
  outputDir: process.env.M2_TEST_OUTPUT_DIR ?? "/tmp/tareeq-milestone-2-results",
  reporter: "line",
  use: {
    baseURL: "http://localhost:3102",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: {
        ...mobileViewport,
        browserName: "chromium",
      },
    },
    {
      name: "mobile-webkit",
      use: {
        ...mobileViewport,
        browserName: "webkit",
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm exec next start -p 3102",
    url: "http://localhost:3102",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
