import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/*.test.ts"],
    exclude: ["tests/integration/**", "tests/helpers/**", "node_modules"],
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
});
