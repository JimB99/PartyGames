import { test, expect, chromium } from "@playwright/test";
import { openHost, joinPlayer, randomRoomId, selectGame } from "./helpers/room.js";

const VIEWPORTS = [
  { name: "tv-720p", width: 1280, height: 720 },
  { name: "tv-1080p", width: 1920, height: 1080 },
  { name: "phone-portrait", width: 390, height: 844 },
  { name: "phone-landscape", width: 844, height: 390 },
  { name: "tablet-portrait", width: 768, height: 1024 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`lobby has no horizontal overflow @ ${viewport.name}`, async () => {
    const browser = await chromium.launch();
    const roomId = randomRoomId();
    const { page: host, context: hostCtx } = await openHost(browser, roomId);
    const { page: player, context: playerCtx } = await joinPlayer(browser, roomId, "Viewport");

    try {
      await host.setViewportSize({ width: viewport.width, height: viewport.height });
      await player.setViewportSize({ width: viewport.width, height: viewport.height });

      const hostOverflow = await host.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      const playerOverflow = await player.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hostOverflow).toBe(false);
      expect(playerOverflow).toBe(false);

      await selectGame(host, "quick-quiz");
      await expect(host.getByTestId("start-game").first()).toBeVisible();

      const hostButton = host.getByTestId("start-game").first();
      const box = await hostButton.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    } finally {
      await hostCtx.close();
      await playerCtx.close();
      await browser.close();
    }
  });
}
