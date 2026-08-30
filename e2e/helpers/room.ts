import { type Browser, type BrowserContext, type Page, expect } from "@playwright/test";
import type { GameId } from "../../packages/shared/src/constants.ts";

export function randomRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function openHost(browser: Browser, roomId: string): Promise<{ page: Page; context: BrowserContext }> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await page.goto(`/host/${roomId}`);
  await expect(page.getByText("Party Games · Host")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Connected", { exact: true })).toBeVisible({ timeout: 30_000 });
  return { page, context };
}

export async function joinPlayer(
  browser: Browser,
  roomId: string,
  nickname: string,
): Promise<{ page: Page; context: BrowserContext }> {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/join");
  await page.getByPlaceholder("CODE").fill(roomId);
  await page.getByPlaceholder("Nickname").fill(nickname);
  await page.getByRole("button", { name: /^join$/i }).click();
  await expect(page.getByText(`Room ${roomId}`)).toBeVisible({ timeout: 30_000 });
  return { page, context };
}

export async function selectGame(host: Page, gameId: GameId): Promise<void> {
  await host.evaluate((id) => {
    const btn = document.querySelector<HTMLButtonElement>(`[data-testid="game-picker-${id}"]`);
    if (!btn) return;
    const section = btn.closest("section");
    const header = section?.querySelector<HTMLButtonElement>('button[aria-expanded="false"]');
    header?.click();
    btn.click();
  }, gameId);
  await expect(host.getByTestId("start-game")).toBeEnabled({ timeout: 15_000 });
}

export async function startGame(host: Page): Promise<void> {
  await host.getByTestId("start-game").click();
  await expect(host.getByTestId("host-game-view")).toBeVisible({ timeout: 60_000 });
}

export async function setupCurveBots(host: Page): Promise<void> {
  const addBot = host.getByRole("button", { name: /add bot/i });
  if (await addBot.isVisible().catch(() => false)) {
    await addBot.click();
  }
}

export interface GameE2EConfig {
  id: GameId;
  minPlayers: number;
  maxPlayers?: number;
  setupHost?: (host: Page) => Promise<void>;
  configureOptions?: (host: Page) => Promise<void>;
  playerAction: (player: Page) => Promise<void>;
}

export interface RunGameOptions {
  playerCount?: number;
  maxSteps?: number;
  pauseOnce?: boolean;
}

export async function hostAdvance(host: Page): Promise<void> {
  const skip = host.getByTestId("host-skip");
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    return;
  }
  const startRound = host.getByRole("button", { name: /start round/i });
  if (await startRound.isVisible().catch(() => false)) {
    await startRound.click();
  }
}

export async function hostPauseResume(host: Page): Promise<void> {
  const pause = host.getByTestId("host-pause");
  if (await pause.isVisible().catch(() => false)) {
    await pause.click();
    await host.getByTestId("host-resume").click({ timeout: 5_000 });
  }
}

export async function waitForGameEnd(host: Page, timeoutMs = 90_000): Promise<boolean> {
  const playAgain = host.getByRole("button", { name: /play again/i });
  try {
    await playAgain.waitFor({ state: "visible", timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}

async function setupRoom(
  browser: Browser,
  config: GameE2EConfig,
  playerCount: number,
): Promise<{ host: Page; players: Page[]; hostCtx: BrowserContext; playerContexts: BrowserContext[] }> {
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const playerContexts: BrowserContext[] = [];
  const players: Page[] = [];

  for (let i = 0; i < playerCount; i++) {
    const { page, context } = await joinPlayer(browser, roomId, `P${i + 1}`);
    playerContexts.push(context);
    players.push(page);
  }

  await expect(host.getByText(`${playerCount} players connected`)).toBeVisible({ timeout: 15_000 });
  await selectGame(host, config.id);
  if (config.configureOptions) await config.configureOptions(host);
  if (config.setupHost) await config.setupHost(host);
  await startGame(host);
  await hostAdvance(host);

  return { host, players, hostCtx, playerContexts };
}

async function playRoundStep(host: Page, players: Page[], config: GameE2EConfig): Promise<void> {
  await hostAdvance(host);
  for (const player of players) {
    await config.playerAction(player).catch(() => {});
  }
}

export async function endGame(host: Page): Promise<void> {
  const end = host.getByRole("button", { name: /^end game$/i });
  if (await end.isVisible().catch(() => false)) {
    await end.click({ timeout: 3_000 }).catch(() => {});
  }
}

export async function runGameSmoke(browser: Browser, config: GameE2EConfig): Promise<void> {
  const { host, players, hostCtx, playerContexts } = await setupRoom(browser, config, config.minPlayers);
  try {
    for (const player of players) {
      await config.playerAction(player).catch(() => {});
    }
    await expect(host.locator(".text-red-300")).toHaveCount(0);
  } finally {
    await endGame(host);
    await hostCtx.close();
    for (const ctx of playerContexts) await ctx.close();
  }
}

export async function runGameFull(
  browser: Browser,
  config: GameE2EConfig,
  opts: RunGameOptions = {},
): Promise<void> {
  const playerCount = opts.playerCount ?? config.minPlayers;
  const maxSteps = opts.maxSteps ?? 80;
  const { host, players, hostCtx, playerContexts } = await setupRoom(browser, config, playerCount);

  try {
    let paused = false;
    for (let step = 0; step < maxSteps; step++) {
      if (await host.getByRole("button", { name: /play again/i }).isVisible().catch(() => false)) {
        break;
      }
      if (opts.pauseOnce && !paused && step === Math.floor(maxSteps / 3)) {
        await hostPauseResume(host);
        paused = true;
      }
      await playRoundStep(host, players, config);
    }

    const ended = await waitForGameEnd(host, 5_000);
    if (!ended) {
      // Arcade/timed games may need extra host skips to reach ended
      for (let i = 0; i < 10; i++) {
        await hostAdvance(host);
        if (await host.getByRole("button", { name: /play again/i }).isVisible().catch(() => false)) break;
      }
    }

    await expect(host.locator(".text-red-300")).toHaveCount(0);
    await expect(host.getByTestId("host-game-view")).toBeVisible();
  } finally {
    await endGame(host);
    await hostCtx.close();
    for (const ctx of playerContexts) await ctx.close();
  }
}
