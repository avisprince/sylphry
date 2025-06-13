import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov"],
    },
    include: ["src/tests/**/*.test.ts"],
  },
});
