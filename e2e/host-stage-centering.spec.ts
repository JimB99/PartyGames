import { test, expect, chromium } from "@playwright/test";
import { ALL_GAME_IDS, type GameId } from "../packages/shared/src/constants.ts";
import { GAME_E2E_CONFIGS } from "./helpers/game-config.ts";
import {
  openHost,
  joinPlayer,
  randomRoomId,
  selectGame,
  startGame,
  hostAdvance,
  enableHostPacing,
} from "./helpers/room.js";
import { assertHeroCentered, assertHostStageVisible } from "./helpers/host-stage.ts";

const SMOKE_GAMES: GameId[] = ["wit-showdown", "draw-guess", "trail-dash"];

async function setupGameHost(gameId: GameId) {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const config = GAME_E2E_CONFIGS[gameId];
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const playerContexts = [];
  const players = [];

  for (let i = 0; i < config.minPlayers; i++) {
    const { page, context } = await joinPlayer(browser, roomId, `P${i + 1}`);
    playerContexts.push(context);
    players.push(page);
  }

  await selectGame(host, gameId);
  await enableHostPacing(host);
  if (config.setupHost) await config.setupHost(host);
  if (config.configureOptions) await config.configureOptions(host);
  await startGame(host);
  await hostAdvance(host);

  return { browser, host, hostCtx, playerContexts, players, config };
}

async function teardown(
  browser: import("@playwright/test").Browser,
  hostCtx: import("@playwright/test").BrowserContext,
  playerContexts: import("@playwright/test").BrowserContext[],
) {
  await hostCtx.close();
  for (const ctx of playerContexts) await ctx.close();
  await browser.close();
}

for (const gameId of ALL_GAME_IDS) {
  const tag = SMOKE_GAMES.includes(gameId) ? "@smoke @host-stage" : "@full @host-stage";

  test(`${tag} ${gameId} centers host-stage on TV`, async () => {
    const { browser, host, hostCtx, playerContexts } = await setupGameHost(gameId);
    try {
      await host.setViewportSize({ width: 1280, height: 720 });
      await assertHostStageVisible(host);
      await assertHeroCentered(host, 140);
      await expect(host.getByTestId("host-game-view")).toBeVisible();
    } finally {
      await teardown(browser, hostCtx, playerContexts);
    }
  });
}

test("@smoke @host-return-lobby wit-showdown vote phase never shows matchup", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const contexts = [];
  const players = [];

  try {
    for (let i = 0; i < 3; i++) {
      const { page, context } = await joinPlayer(browser, roomId, `P${i + 1}`);
      contexts.push(context);
      players.push(page);
    }
    await selectGame(host, "wit-showdown");
    await enableHostPacing(host);
    await startGame(host);
    await hostAdvance(host);

    for (const player of players) {
      const input = player.getByTestId("player-text-input");
      await expect(input).toBeVisible({ timeout: 15_000 });
      await input.fill(`Answer from ${await player.evaluate(() => document.title)}`);
      await player.getByTestId("player-submit").click();
    }

    await expect
      .poll(async () => await host.getByTestId("host-game-view").getAttribute("data-phase"), { timeout: 30_000 })
      .toBe("vote");
    await expect(host.getByText(/matchup\s+\d/i)).toHaveCount(0);
    await expect(host.getByTestId("host-stage")).toBeVisible();
  } finally {
    await hostCtx.close();
    for (const ctx of contexts) await ctx.close();
    await browser.close();
  }
});
