import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],  // only unit tests
    exclude: ["tests/e2e/**"]             // ignore e2e here
  }
});
