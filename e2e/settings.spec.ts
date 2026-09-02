import { test, expect, chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { openHost, joinPlayer, randomRoomId, selectGame, startGame, hostAdvance } from "./helpers/room.js";

const quizPath = join(process.cwd(), "packages", "shared", "content", "trivia", "quiz.json");

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
    await expect(host.getByTestId("start-game").last()).toBeEnabled();
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
    await expect(host.getByTestId("start-game").last()).toBeEnabled();
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
    await expect(host.getByTestId("start-game").last()).toBeEnabled();
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});

test("@settings 18+ quick-quiz stays on mature questions", async () => {
  const quiz = JSON.parse(readFileSync(quizPath, "utf8")) as Array<{ question: string; rating?: string }>;
  const matureQuestions = new Set(quiz.filter((q) => q.rating === "mature").map((q) => q.question));
  const familyQuestions = new Set(quiz.filter((q) => (q.rating ?? "family") === "family").map((q) => q.question));

  const browser = await chromium.launch();
  const roomId = randomRoomId();
  const { page: host, context: hostCtx } = await openHost(browser, roomId);
  const { context: playerCtx } = await joinPlayer(browser, roomId, "P1");

  try {
    await selectGame(host, "quick-quiz");
    await host.getByTestId("game-option-content-mature").last().click();
    await startGame(host);
    await expect(host.getByTestId("content-rating-badge")).toBeVisible();
    await hostAdvance(host);
    const question = (await host.getByTestId("host-prompt-text").innerText()).trim();
    expect(matureQuestions.has(question), `18+ quiz showed unrated/family prompt: ${question}`).toBe(true);
    expect(familyQuestions.has(question), `18+ quiz leaked family prompt: ${question}`).toBe(false);
  } finally {
    await hostCtx.close();
    await playerCtx.close();
    await browser.close();
  }
});

