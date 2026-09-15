import { test } from "@playwright/test";
import { ALL_GAME_IDS } from "../../packages/shared/src/constants.ts";
import { GAME_E2E_CONFIGS } from "../helpers/game-config.js";
import { runGameSmoke } from "../helpers/room.js";

for (const gameId of ALL_GAME_IDS) {
  test(`@smoke ${gameId} smoke flow`, async ({ browser }) => {
    await runGameSmoke(browser, GAME_E2E_CONFIGS[gameId]);
  });
}
