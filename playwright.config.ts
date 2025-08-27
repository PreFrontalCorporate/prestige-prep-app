import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./tests/e2e", retries: 0, use: { headless: true } });
