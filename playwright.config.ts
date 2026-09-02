import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: /live-smoke\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 120_000,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-reports/playwright-results.json" }],
  ],
  use: {
    baseURL: "http://localhost:5178",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter @party-games/shared build && npx wrangler dev --port 8787",
      url: "http://localhost:8787",
      reuseExistingServer: false,
      timeout: 120_000,
      cwd: process.cwd(),
    },
    {
      command: "pnpm --filter client dev",
      url: "http://localhost:5178",
      reuseExistingServer: false,
      timeout: 120_000,
      cwd: process.cwd(),
      env: {
        ...process.env,
        VITE_PARTYKIT_HOST: "localhost:8787",
      },
    },
  ],
});
