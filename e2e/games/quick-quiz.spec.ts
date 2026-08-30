import { test, chromium } from "@playwright/test";
import { GAME_E2E_CONFIGS } from "../helpers/game-config.js";
import { runGameSmoke } from "../helpers/room.js";

test("quick-quiz smoke flow", async () => {
  const browser = await chromium.launch();
  try {
    await runGameSmoke(browser, GAME_E2E_CONFIGS["quick-quiz"]);
  } finally {
    await browser.close();
  }
});
