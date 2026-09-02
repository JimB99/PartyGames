import { test, expect, chromium } from "@playwright/test";
import { openHost, joinPlayer, randomRoomId, selectGame, startGame } from "./helpers/room.js";

test("live site: host, join, start Quick Quiz", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { page: player, context: playerCtx } = await joinPlayer(browser, roomId, "LiveP1");

  try {
    await expect(host.getByText("Connected", { exact: true })).toBeVisible();
    await expect(player.getByText(`Room ${roomId}`)).toBeVisible();
    await expect(host.getByTestId("game-picker-caption-this")).toBeVisible();
    await selectGame(host, "quick-quiz");
    await startGame(host);
    await expect(host.getByTestId("host-game-view")).toBeVisible();
    await expect(host.getByText(/Quick Quiz/i).first()).toBeVisible();
    await expect(host.locator(".text-red-300")).toHaveCount(0);
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});
