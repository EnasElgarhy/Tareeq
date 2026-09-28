import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "react",
    },
  },
  // Map the `@/*` path alias (from tsconfig) so tests can import modules
  // that use `@/...` (e.g. lib/analytics/*).
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    // e2e/**/*.spec.ts are Playwright specs (@playwright/test's `test`),
    // not Vitest — Vitest's default include glob would otherwise pick
    // them up and fail on the unfamiliar `test.beforeEach` signature.
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
});
