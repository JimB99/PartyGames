import { test, expect, chromium } from "@playwright/test";
import { openHost, joinPlayer, randomRoomId, selectGame, startGame, hostAdvance, hostPauseResume } from "./helpers/room.js";

test("@host-controls pause, resume, skip, extend on quick-quiz", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { page: player, context: playerCtx } = await joinPlayer(browser, roomId, "P1");

  try {
    await selectGame(host, "quick-quiz");
    await startGame(host);
    await hostPauseResume(host);
    await hostAdvance(host);
    await host.getByTestId("host-extend").click();
    await player.getByTestId("player-answer-0").click({ timeout: 15_000 });
    await expect(host.locator(".text-red-300")).toHaveCount(0);
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});
