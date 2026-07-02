import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
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
  },
});
