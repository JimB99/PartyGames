import { test, expect, chromium } from "@playwright/test";
import { openHost, joinPlayer, randomRoomId, selectGame } from "./helpers/room.js";

test("@settings mature content toggle on agent-grid", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const contexts = [];

  try {
    for (let i = 0; i < 4; i++) {
      const { context } = await joinPlayer(browser, roomId, `P${i + 1}`);
      contexts.push(context);
    }

    await selectGame(host, "agent-grid");
    await expect(host.getByTestId("game-options-panel").last()).toBeVisible();
    await host.getByTestId("game-option-content-mature").last().click();
    await expect(host.getByTestId("start-game")).toBeEnabled();
  } finally {
    await hostCtx.close();
    for (const ctx of contexts) await ctx.close();
    await browser.close();
  }
});

test("@settings difficulty on hangman-race", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const contexts = [];

  try {
    for (let i = 0; i < 2; i++) {
      const { context } = await joinPlayer(browser, roomId, `P${i + 1}`);
      contexts.push(context);
    }

    await selectGame(host, "hangman-race");
    await expect(host.getByTestId("game-options-panel").last()).toBeVisible();
    await host.getByTestId("game-options-panel").last().locator("select").first().selectOption("hard");
    await expect(host.getByTestId("start-game")).toBeEnabled();
  } finally {
    await hostCtx.close();
    for (const ctx of contexts) await ctx.close();
    await browser.close();
  }
});

test("@settings trail-dash bot setup", async () => {
  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { context: playerCtx } = await joinPlayer(browser, roomId, "P1");

  try {
    await selectGame(host, "trail-dash");
    const addBot = host.getByRole("button", { name: /add bot/i });
    if (await addBot.isVisible().catch(() => false)) {
      await addBot.click();
    }
    await expect(host.getByTestId("start-game")).toBeEnabled();
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});
