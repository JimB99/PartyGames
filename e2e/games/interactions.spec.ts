import { test, chromium } from "@playwright/test";
import { ALL_GAME_IDS } from "../../packages/shared/src/constants.ts";
import { GAME_E2E_CONFIGS } from "../helpers/game-config.js";
import {
  openHost,
  joinPlayer,
  randomRoomId,
  selectGame,
  startGame,
  hostAdvance,
  assertNoErrors,
  clickInteraction,
} from "../helpers/room.js";

for (const gameId of ALL_GAME_IDS) {
  test(`@interactions ${gameId} player controls`, async () => {
    const config = GAME_E2E_CONFIGS[gameId];
    const browser = await chromium.launch();
    const roomId = randomRoomId();
    const { page: host, context: hostCtx } = await openHost(browser, roomId);
    const playerContexts = [];
    const players = [];

    try {
      for (let i = 0; i < config.minPlayers; i++) {
        const { page, context } = await joinPlayer(browser, roomId, `P${i + 1}`);
        playerContexts.push(context);
        players.push(page);
      }

      await selectGame(host, gameId);
      if (config.setupHost) await config.setupHost(host);
      await startGame(host);
      await hostAdvance(host);
      await host.waitForTimeout(500);

      for (const player of players) {
        const ids = config.interactions?.player ?? [];
        let acted = false;
        for (const testId of ids) {
          if (await clickInteraction(player, testId)) acted = true;
        }
        if (!acted && ids.length > 0) {
          await config.playerAction(player, false);
        }
      }
      await assertNoErrors(host);
    } finally {
      await hostCtx.close();
      for (const ctx of playerContexts) await ctx.close();
      await browser.close();
    }
  });
}
