import { test, expect, chromium } from "@playwright/test";
import {
  openHost,
  joinPlayer,
  randomRoomId,
  selectGame,
  startGame,
  hostAdvance,
  hostPauseResume,
  enableHostPacing,
  assertNoErrors,
} from "./helpers/room.js";

test("@host-controls pause, resume, skip, extend on trivia", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { page: player, context: playerCtx } = await joinPlayer(browser, roomId, "P1");

  try {
    await selectGame(host, "trivia");
    await startGame(host);
    await hostAdvance(host);
    await hostPauseResume(host);
    const answer = player.getByTestId("player-answer-0");
    if (await answer.isVisible().catch(() => false)) {
      await answer.click();
    }
    const extend = host.getByTestId("host-extend");
    if (await extend.isVisible().catch(() => false)) {
      await extend.click();
    }
    await player.getByTestId("player-answer-0").click({ timeout: 15_000 });
    await assertNoErrors(host);
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});

test("@host-controls skip on bluff during submit", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const contexts = [];

  try {
    for (let i = 0; i < 2; i++) {
      const { page, context } = await joinPlayer(browser, roomId, `P${i + 1}`);
      contexts.push(context);
    }
    await selectGame(host, "bluff");
    await startGame(host);
    await hostAdvance(host);
    await expect
      .poll(async () => host.getByTestId("host-game-view").getAttribute("data-phase"), { timeout: 15_000 })
      .toBe("submit");
    await host.getByTestId("host-skip").click({ timeout: 10_000 });
    await expect
      .poll(async () => host.getByTestId("host-game-view").getAttribute("data-phase"), { timeout: 15_000 })
      .not.toBe("submit");
    await assertNoErrors(host);
  } finally {
    await hostCtx.close();
    for (const ctx of contexts) await ctx.close();
    await browser.close();
  }
});

test("@host-controls auto skip leaves trivia question", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { context: playerCtx } = await joinPlayer(browser, roomId, "P1");

  try {
    await selectGame(host, "trivia");
    await startGame(host);
    await hostAdvance(host);
    await expect
      .poll(async () => host.getByTestId("host-game-view").getAttribute("data-phase"), { timeout: 15_000 })
      .toBe("question");
    await host.getByTestId("host-skip").click();
    await expect
      .poll(async () => host.getByTestId("host-game-view").getAttribute("data-phase"), { timeout: 15_000 })
      .not.toBe("question");
    await assertNoErrors(host);
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});

test("@host-controls host-pacing skip leaves trivia question", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { context: playerCtx } = await joinPlayer(browser, roomId, "P1");

  try {
    await selectGame(host, "trivia");
    await enableHostPacing(host);
    await startGame(host);
    await hostAdvance(host);
    await expect
      .poll(async () => host.getByTestId("host-game-view").getAttribute("data-phase"), { timeout: 15_000 })
      .toBe("question");
    await host.getByTestId("host-skip").click();
    await expect
      .poll(async () => host.getByTestId("host-game-view").getAttribute("data-phase"), { timeout: 15_000 })
      .not.toBe("question");
    await assertNoErrors(host);
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});

test("@host-controls pause on paddle-clash", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const contexts = [];

  try {
    for (let i = 0; i < 2; i++) {
      const { page, context } = await joinPlayer(browser, roomId, `P${i + 1}`);
      contexts.push(context);
    }
    await selectGame(host, "paddle-clash");
    await startGame(host);
    await hostAdvance(host);
    await hostPauseResume(host);
    await assertNoErrors(host);
  } finally {
    await hostCtx.close();
    for (const ctx of contexts) await ctx.close();
    await browser.close();
  }
});

test("@host-controls waiting count follows connected roster", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { context: p1Ctx } = await joinPlayer(browser, roomId, "P1");
  const { context: p2Ctx } = await joinPlayer(browser, roomId, "P2");

  try {
    await selectGame(host, "trivia");
    await startGame(host);
    await hostAdvance(host);
    await expect
      .poll(async () => host.getByTestId("host-game-view").getAttribute("data-phase"), { timeout: 15_000 })
      .toBe("question");
    await expect(host.getByTestId("waiting-progress")).toContainText("/2");

    const { context: lateCtx } = await joinPlayer(browser, roomId, "Late");
    await expect(host.getByTestId("waiting-progress")).toContainText("/2");
    await lateCtx.close();

    await p2Ctx.close();
    await expect
      .poll(async () => host.getByTestId("waiting-progress").textContent(), { timeout: 15_000 })
      .toMatch(/\/1\b/);
    await assertNoErrors(host);
  } finally {
    await hostCtx.close();
    await p1Ctx.close();
    await browser.close();
  }
});
