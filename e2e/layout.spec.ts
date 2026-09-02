import { test, expect, chromium } from "@playwright/test";
import { openHost, joinPlayer, randomRoomId, selectGame } from "./helpers/room.js";

test("lobby layout has no horizontal overflow on host and player", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { page: player, context: playerCtx } = await joinPlayer(browser, roomId, "LayoutTest");

  try {
    const hostOverflow = await host.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hostOverflow).toBe(false);

    const playerOverflow = await player.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(playerOverflow).toBe(false);

    await selectGame(host, "quick-quiz");
    await expect(host.getByTestId("start-game").first()).toBeEnabled();
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});