import { test, chromium } from "@playwright/test";
import { ALL_GAME_IDS } from "../../packages/shared/src/constants.ts";
import { GAME_E2E_CONFIGS, NEW_GAME_IDS, midPlayerCount } from "../helpers/game-config.js";
import { runGameFull } from "../helpers/room.js";

for (const gameId of ALL_GAME_IDS) {
  test(`@full ${gameId} full playthrough @ min players`, async () => {
    const browser = await chromium.launch();
    try {
      await runGameFull(browser, GAME_E2E_CONFIGS[gameId], { pauseOnce: true });
    } finally {
      await browser.close();
    }
  });
}

for (const gameId of NEW_GAME_IDS) {
  test(`@full @new ${gameId} full playthrough @ mid players`, async () => {
    const config = GAME_E2E_CONFIGS[gameId];
    const browser = await chromium.launch();
    try {
      await runGameFull(browser, config, { playerCount: midPlayerCount(config), pauseOnce: true });
    } finally {
      await browser.close();
    }
  });
}
