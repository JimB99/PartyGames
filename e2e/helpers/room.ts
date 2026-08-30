import { type Browser, type BrowserContext, type Page, expect } from "@playwright/test";
import type { GameId } from "@party-games/shared";

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
  setupHost?: (host: Page) => Promise<void>;
  playerAction: (player: Page) => Promise<void>;
}

export async function runGameSmoke(
  browser: Browser,
  config: GameE2EConfig,
): Promise<void> {
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const playerContexts: BrowserContext[] = [];

  try {
    const extraPlayers = config.minPlayers;
    const players: Page[] = [];
    for (let i = 0; i < extraPlayers; i++) {
      const { page, context } = await joinPlayer(browser, roomId, `P${i + 1}`);
      playerContexts.push(context);
      players.push(page);
    }

    await expect(host.getByText(`${extraPlayers} players connected`)).toBeVisible({ timeout: 15_000 });

    await selectGame(host, config.id);
    if (config.setupHost) await config.setupHost(host);
    await startGame(host);

    const startRound = host.getByRole("button", { name: /start round/i });
    if (await startRound.isVisible().catch(() => false)) {
      await startRound.click();
    }

    if (players.length > 0) {
      await config.playerAction(players[0]);
    }

    await expect(host.locator(".text-red-300")).toHaveCount(0);
  } finally {
    await hostCtx.close();
    for (const ctx of playerContexts) await ctx.close();
  }
}
