import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Map the `@/*` path alias (from tsconfig) so tests can import modules
  // that use `@/...` (e.g. lib/results/framework.ts).
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  // tsconfig keeps JSX for Next ("preserve"); compile it in tests so
  // components can be rendered to markup.
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    environment: "happy-dom",
    globals: true,
  },
});
