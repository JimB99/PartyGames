import { type Browser, type BrowserContext, type Page, expect } from "@playwright/test";
import type { GameId } from "../../packages/shared/src/constants.ts";
import type { GameInteractions } from "./game-interactions.ts";
import { fullMaxStepsFor } from "./game-limits.ts";
import { dismissProfileModal } from "./player-ui.ts";
import { actForVisibleControls, readPlayerPhase } from "./phase-action.ts";

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
  const card = host.getByTestId(`game-picker-${gameId}`);
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click({ force: true });
  await expect(host.getByTestId("start-game").first()).toBeEnabled({ timeout: 15_000 });
}

export async function startGame(host: Page): Promise<void> {
  await host.getByTestId("start-game").first().click();
  await expect(host.getByTestId("host-game-view")).toBeVisible({ timeout: 60_000 });
}

export async function assertNoErrors(host: Page): Promise<void> {
  await expect(host.locator(".text-red-300")).toHaveCount(0);
}

export interface GameE2EConfig {
  id: GameId;
  minPlayers: number;
  maxPlayers?: number;
  fullMaxSteps?: number;
  interactions?: GameInteractions;
  setupHost?: (host: Page) => Promise<void>;
  configureOptions?: (host: Page) => Promise<void>;
  playerAction: (player: Page, strict?: boolean) => Promise<void>;
}

export interface RunGameOptions {
  playerCount?: number;
  maxSteps?: number;
  pauseOnce?: boolean;
  strict?: boolean;
}

/** Enable host-paced phases so Skip advances timer-driven steps in E2E. */
export async function enableHostPacing(host: Page): Promise<void> {
  const pacingHost = host.getByTestId("game-option-pacing-host");
  if (await pacingHost.isVisible().catch(() => false)) {
    await pacingHost.click();
  }
}

export async function hostAdvance(host: Page): Promise<void> {
  const skip = host.getByTestId("host-skip");
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await host.waitForTimeout(480);
  } else {
    const startRound = host.getByRole("button", { name: /start round/i });
    if (await startRound.isVisible().catch(() => false)) {
      await startRound.click();
      await host.waitForTimeout(150);
    }
  }
}

export async function hostPauseResume(host: Page): Promise<void> {
  const pause = host.getByTestId("host-pause");
  if (!(await pause.isVisible().catch(() => false))) return;
  if (!(await pause.isEnabled().catch(() => false))) return;
  await pause.click();
  const resume = host.getByTestId("host-resume");
  try {
    await resume.waitFor({ state: "visible", timeout: 10_000 });
    await resume.click();
  } catch {
    // Pause may be unavailable for this phase; continue the playthrough.
  }
}

async function readHostPhase(host: Page): Promise<string | null> {
  return host.getByTestId("host-game-view").getAttribute("data-phase").catch(() => null);
}

export async function isGameEnded(host: Page): Promise<boolean> {
  const view = host.getByTestId("host-game-view");
  const phase = await readHostPhase(host);
  if (phase === "ended") return true;
  if (await host.getByTestId("host-play-again").isVisible().catch(() => false)) return true;
  if (await host.getByRole("button", { name: /play again/i }).isVisible().catch(() => false)) {
    return true;
  }
  if (await view.getByText(/final scores/i).isVisible().catch(() => false)) return true;
  if (await view.getByText(/game over/i).isVisible().catch(() => false)) return true;
  if (await view.getByText(/^winner:/i).isVisible().catch(() => false)) return true;
  const text = await view.innerText().catch(() => "");
  return /\bended\b|final scores|champion|winner|game over/i.test(text);
}

export async function waitForGameEnd(host: Page, timeoutMs = 90_000): Promise<boolean> {
  try {
    await host.getByRole("button", { name: /play again/i }).waitFor({ state: "visible", timeout: timeoutMs });
    return true;
  } catch {
    return await isGameEnded(host);
  }
}

/** Click a testid or prefix* pattern control if visible and enabled. */
export async function clickInteraction(page: Page, testId: string): Promise<boolean> {
  if (testId.endsWith("*")) {
    const prefix = testId.slice(0, -1);
    const els = page.locator(`[data-testid^="${prefix}"]`);
    const count = await els.count();
    let acted = false;
    for (let i = 0; i < count; i++) {
      const el = els.nth(i);
      if (!(await el.isVisible().catch(() => false))) continue;
      const tag = await el.evaluate((node) => node.tagName.toLowerCase()).catch(() => "");
      if (tag === "select") {
        await el.selectOption({ index: 1 });
        acted = true;
        continue;
      }
      if (!(await el.isEnabled().catch(() => true))) continue;
      try {
        await el.click({ timeout: 5_000 });
        acted = true;
        break;
      } catch {
        // Phase may have advanced (e.g. vote buttons removed after first pick).
      }
    }
    return acted;
  }
  const el = page.getByTestId(testId);
  if (!(await el.isVisible().catch(() => false))) return false;
  const tag = await el.evaluate((node) => node.tagName.toLowerCase()).catch(() => "");
  if (tag === "select") {
    await el.selectOption({ index: 1 });
    return true;
  }
  if (!(await el.isEnabled().catch(() => true))) return false;
  try {
    await el.click({ timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

export async function assertInteractionsVisible(page: Page, testIds: string[]): Promise<void> {
  let anyVisible = false;
  for (const testId of testIds) {
    if (testId.endsWith("*")) {
      const prefix = testId.slice(0, -1);
      const count = await page.locator(`[data-testid^="${prefix}"]`).count();
      if (count > 0) anyVisible = true;
    } else if (await page.getByTestId(testId).isVisible().catch(() => false)) {
      anyVisible = true;
    }
  }
  expect(anyVisible, `Expected at least one interaction control visible: ${testIds.join(", ")}`).toBe(true);
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
  await enableHostPacing(host);
  if (config.configureOptions) await config.configureOptions(host);
  if (config.setupHost) await config.setupHost(host);
  await startGame(host);
  await hostAdvance(host);

  return { host, players, hostCtx, playerContexts };
}

async function playRoundStep(
  host: Page,
  players: Page[],
  config: GameE2EConfig,
  strict = true,
  phaseAware = false,
): Promise<boolean> {
  const hostBefore = await host.getByTestId("host-game-view").innerText().catch(() => "");
  let anyActed = false;

  for (const player of players) {
    if (await isGameEnded(host)) return true;

    if (phaseAware) {
      if (await actForVisibleControls(player, config.id, config.playerAction, strict)) {
        anyActed = true;
      }
    } else {
      await config.playerAction(player, strict);
      anyActed = true;
    }
  }

  if (await isGameEnded(host)) return true;

  await hostAdvance(host);

  if (await isGameEnded(host)) return true;
  await assertNoErrors(host);

  const hostAfter = await host.getByTestId("host-game-view").innerText().catch(() => "");
  if (anyActed || hostBefore !== hostAfter) return true;
  return false;
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
      await dismissProfileModal(player);
      await config.playerAction(player, false);
    }
    await assertNoErrors(host);
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
  const maxSteps = opts.maxSteps ?? config.fullMaxSteps ?? fullMaxStepsFor(config.id);
  const strict = opts.strict ?? true;
  const { host, players, hostCtx, playerContexts } = await setupRoom(browser, config, playerCount);

  try {
    let paused = false;
    let idleSteps = 0;

    for (let step = 0; step < maxSteps; step++) {
      if (await isGameEnded(host)) break;

      if (opts.pauseOnce && !paused && step === Math.floor(maxSteps / 3)) {
        await hostPauseResume(host);
        paused = true;
      }

      const progressed = await playRoundStep(host, players, config, strict, true);
      if (await isGameEnded(host)) break;

      if (!progressed) {
        idleSteps++;
        if (idleSteps >= 5) {
          const phases = await Promise.all(players.map((p) => readPlayerPhase(p)));
          throw new Error(
            `${config.id} full playthrough stalled after ${step + 1} steps (player phases: ${phases.join(", ")})`,
          );
        }
      } else {
        idleSteps = 0;
      }
    }

    if (!(await isGameEnded(host))) {
      for (let i = 0; i < 20; i++) {
        await hostAdvance(host);
        if (await isGameEnded(host)) break;
      }
    }

    await expect.poll(async () => await isGameEnded(host), { timeout: 30_000 }).toBe(true);
    await assertNoErrors(host);
    await expect(host.getByTestId("host-game-view")).toBeVisible();
  } finally {
    await endGame(host);
    await hostCtx.close();
    for (const ctx of playerContexts) await ctx.close();
  }
}
