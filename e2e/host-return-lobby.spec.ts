import { test, expect, chromium } from "@playwright/test";
import {
  openHost,
  joinPlayer,
  randomRoomId,
  selectGame,
  startGame,
  hostAdvance,
  enableHostPacing,
  isGameEnded,
} from "./helpers/room.js";

test("@smoke @host-return-lobby skips confirm when game has ended", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const contexts = [];
  const players = [];

  try {
    for (let i = 0; i < 2; i++) {
      const { page, context } = await joinPlayer(browser, roomId, `P${i + 1}`);
      contexts.push(context);
      players.push(page);
    }

    await selectGame(host, "word-rush");
    await enableHostPacing(host);
    await startGame(host);
    await hostAdvance(host);

    for (let step = 0; step < 60; step++) {
      if (await isGameEnded(host)) break;
      for (const player of players) {
        const input = player.getByTestId("player-text-input");
        if (await input.isVisible().catch(() => false)) {
          await input.fill("race");
          await player.getByTestId("player-submit").click().catch(() => {});
        }
      }
      await hostAdvance(host);
      await host.waitForTimeout(200);
    }

    await expect.poll(async () => await isGameEnded(host), { timeout: 60_000 }).toBe(true);
    await expect(host.getByTestId("host-game-view")).toHaveAttribute("data-phase", "ended");

    await host.evaluate(() => {
      window.confirm = () => {
        throw new Error("confirm should not be called when game is over");
      };
    });

    await host.getByTestId("host-return-lobby").click();
    await expect(host.getByText("Pick a game")).toBeVisible({ timeout: 15_000 });
    await expect(host.getByTestId("host-game-view")).toHaveCount(0);
  } finally {
    await hostCtx.close();
    for (const ctx of contexts) await ctx.close();
    await browser.close();
  }
});

test("@host-return-lobby mid-game cancel keeps player in game", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { page: player, context: playerCtx } = await joinPlayer(browser, roomId, "P1");

  try {
    await selectGame(host, "quick-quiz");
    await startGame(host);
    await hostAdvance(host);
    await expect(host.getByTestId("host-game-view")).toBeVisible();
    await expect(host.getByTestId("host-game-view")).not.toHaveAttribute("data-phase", "ended");

    await host.evaluate(() => {
      window.confirm = () => false;
    });
    await host.getByRole("button", { name: /leave game/i }).click();
    await expect(host.getByTestId("host-game-view")).toBeVisible();
    await expect(host.getByText("Pick a game")).toHaveCount(0);
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});

test("@host-return-lobby mid-game confirm returns to lobby", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { page: player, context: playerCtx } = await joinPlayer(browser, roomId, "P1");

  try {
    await selectGame(host, "quick-quiz");
    await startGame(host);
    await hostAdvance(host);
    await expect(host.getByTestId("host-game-view")).toBeVisible();
    await expect(host.getByTestId("host-game-view")).not.toHaveAttribute("data-phase", "ended");

    await host.evaluate(() => {
      (window as unknown as { __confirmCalls: number }).__confirmCalls = 0;
      window.confirm = () => {
        (window as unknown as { __confirmCalls: number }).__confirmCalls += 1;
        return true;
      };
    });
    await host.getByRole("button", { name: /leave game/i }).click();
    await expect(host.getByText("Pick a game")).toBeVisible({ timeout: 15_000 });

    const confirmCalls = await host.evaluate(
      () => (window as unknown as { __confirmCalls?: number }).__confirmCalls ?? 0,
    );
    expect(confirmCalls).toBe(1);
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});
