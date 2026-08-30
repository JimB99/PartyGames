import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 120_000,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npx wrangler dev --port 8787",
      url: "http://localhost:8787",
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: process.cwd(),
    },
    {
      command: "pnpm --filter client dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: process.cwd(),
      env: {
        ...process.env,
        VITE_PARTYKIT_HOST: "localhost:8787",
      },
    },
  ],
});
