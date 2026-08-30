import { test, chromium } from "@playwright/test";
import { GAME_E2E_CONFIGS } from "../helpers/game-config.js";
import { runGameSmoke } from "../helpers/room.js";

test("tetris-battle smoke flow", async () => {
  const browser = await chromium.launch();
  try {
    await runGameSmoke(browser, GAME_E2E_CONFIGS["tetris-battle"]);
  } finally {
    await browser.close();
  }
});
