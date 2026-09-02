import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /live-smoke\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.LIVE_BASE_URL ?? "https://party-games.jimb99.workers.dev",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
