import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Capped rather than left at the default (CPU count): a cold Next.js dev
  // server compiles each route on first request, and enough concurrent
  // first hits during that compile can abort each other's navigation
  // (net::ERR_ABORTED) before the server catches up. Confirmed serially
  // (1 worker) and at 2 — both fully green; higher counts reintroduced the
  // flake against a cold server.
  workers: process.env.CI ? 1 : 2,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // Fixed, non-default port: 3000 is commonly already occupied by another
    // project's dev server on this machine, and reuseExistingServer would
    // silently reuse that unrelated server instead of failing loudly.
    command: "pnpm exec next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
