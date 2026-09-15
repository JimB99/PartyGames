import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

/** Prefer the user's real Playwright browsers over Cursor sandbox cache. */
function resolveBrowsersPath(): string | undefined {
  const current = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (current && !current.includes("cursor-sandbox-cache")) return current;
  const localAppData = process.env.LOCALAPPDATA ?? process.env.HOME;
  if (localAppData) return join(localAppData, "ms-playwright");
  return undefined;
}

const browsersPath = resolveBrowsersPath();
if (browsersPath) process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;

const reuseServer = !process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: /live-smoke\.spec\.ts/,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-reports/playwright-results.json" }],
  ],
  use: {
    baseURL: "http://localhost:5178",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "pnpm --filter @party-games/shared build && npx wrangler dev --port 8787",
      url: "http://localhost:8787",
      reuseExistingServer: reuseServer,
      timeout: 120_000,
      cwd: process.cwd(),
    },
    {
      command: "pnpm --filter client dev",
      url: "http://localhost:5178",
      reuseExistingServer: reuseServer,
      timeout: 120_000,
      cwd: process.cwd(),
      env: {
        ...process.env,
        VITE_PARTYKIT_HOST: "localhost:8787",
      },
    },
  ],
  projects: [
    {
      name: "smoke",
      grep: /@smoke/,
      workers: 4,
      fullyParallel: true,
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"], trace: "off" },
    },
    {
      name: "full",
      grep: /@full/,
      workers: 1,
      fullyParallel: false,
      timeout: 480_000,
      use: { ...devices["Desktop Chrome"], trace: "on-first-retry" },
    },
    {
      name: "other",
      testMatch: [
        /settings\.spec\.ts/,
        /host-controls\.spec\.ts/,
        /layout\.spec\.ts/,
        /scoring\.spec\.ts/,
        /interactions\.spec\.ts/,
      ],
      workers: 1,
      fullyParallel: false,
      timeout: 120_000,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
