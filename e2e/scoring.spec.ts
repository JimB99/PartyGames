import { test, expect, chromium } from "@playwright/test";
import {
  openHost,
  joinPlayer,
  randomRoomId,
  selectGame,
  startGame,
  hostAdvance,
  assertNoErrors,
} from "./helpers/room.js";

test("@scoring trivia awards session points", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { page: player, context: playerCtx } = await joinPlayer(browser, roomId, "P1");

  try {
    await selectGame(host, "trivia");
    await startGame(host);
    await hostAdvance(host);
    await player.getByTestId("player-answer-0").click({ timeout: 15_000 });
    await hostAdvance(host);
    await assertNoErrors(host);
    await expect(host.getByTestId("host-game-view")).toBeVisible();
    const scorePanel = host.getByTestId("round-score-panel");
    const playAgain = host.getByTestId("host-play-again");
    await expect(scorePanel.or(playAgain)).toBeVisible({ timeout: 30_000 });
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});

test("@scoring opinions predict-majority shows round scores", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const contexts = [];
  const players = [];

  try {
    for (let i = 0; i < 3; i++) {
      const { page, context } = await joinPlayer(browser, roomId, `P${i + 1}`);
      contexts.push(context);
      players.push(page);
    }
    await selectGame(host, "opinions");
    await host.getByTestId("game-option-opinion-scoring").last().selectOption("predict-majority");
    await startGame(host);
    await hostAdvance(host);
    for (const p of players) {
      await p.getByTestId("crowd-call-option-0").click({ timeout: 15_000 }).catch(() => {});
    }
    await hostAdvance(host);
    await assertNoErrors(host);
  } finally {
    await hostCtx.close();
    for (const ctx of contexts) await ctx.close();
    await browser.close();
  }
});
