import type { GameId } from "@party-games/shared";
import type { GameE2EConfig } from "./room.js";

async function submitText(page: import("@playwright/test").Page) {
  const input = page.getByTestId("player-text-input");
  if (await input.isVisible().catch(() => false)) {
    await input.fill("Test answer");
    await page.getByTestId("player-submit").click();
    return;
  }
  await page.getByRole("button").first().click({ timeout: 5000 }).catch(() => {});
}

export const GAME_E2E_CONFIGS: Record<GameId, GameE2EConfig> = {
  fibbage: { id: "fibbage", minPlayers: 2, playerAction: submitText },
  quiplash: { id: "quiplash", minPlayers: 3, playerAction: submitText },
  "quick-quiz": {
    id: "quick-quiz",
    minPlayers: 1,
    playerAction: async (page) => {
      await page.getByTestId("player-answer-0").click({ timeout: 15_000 });
    },
  },
  "would-you-rather": {
    id: "would-you-rather",
    minPlayers: 2,
    playerAction: async (page) => {
      await page.getByRole("button").first().click({ timeout: 15_000 });
    },
  },
  "caption-this": { id: "caption-this", minPlayers: 3, playerAction: submitText },
  "draw-guess": { id: "draw-guess", minPlayers: 3, playerAction: submitText },
  "bracket-battle": { id: "bracket-battle", minPlayers: 4, playerAction: submitText },
  "role-sort": {
    id: "role-sort",
    minPlayers: 3,
    playerAction: async (page) => {
      const assign = page.getByRole("button", { name: /assign|confirm|done/i });
      if (await assign.isVisible().catch(() => false)) await assign.click();
    },
  },
  timeline: {
    id: "timeline",
    minPlayers: 2,
    playerAction: async (page) => {
      const lock = page.getByRole("button", { name: /lock in/i });
      if (await lock.isVisible().catch(() => false)) await lock.click();
    },
  },
  impostor: {
    id: "impostor",
    minPlayers: 4,
    playerAction: async (page) => {
      const done = page.getByRole("button", { name: /done/i });
      if (await done.isVisible().catch(() => false)) await done.click();
    },
  },
  "curve-fever": {
    id: "curve-fever",
    minPlayers: 1,
    setupHost: async (host) => {
      const addBot = host.getByRole("button", { name: /add bot/i });
      if (await addBot.isVisible().catch(() => false)) await addBot.click();
    },
    playerAction: async (page) => {
      await page.getByTestId("curve-turn-left").click({ timeout: 15_000 }).catch(() => {});
    },
  },
  "word-rush": { id: "word-rush", minPlayers: 2, playerAction: submitText },
  "fibbage-reverse": { id: "fibbage-reverse", minPlayers: 2, playerAction: submitText },
  "team-charades": {
    id: "team-charades",
    minPlayers: 3,
    playerAction: async (page) => {
      const correct = page.getByRole("button", { name: /correct/i });
      if (await correct.isVisible().catch(() => false)) await correct.click();
    },
  },
  "hot-seat": { id: "hot-seat", minPlayers: 3, playerAction: submitText },
  "last-on-the-dike": {
    id: "last-on-the-dike",
    minPlayers: 4,
    playerAction: async (page) => {
      const bid = page.getByRole("button", { name: /bid|submit|lock/i });
      if (await bid.isVisible().catch(() => false)) await bid.click();
    },
  },
  "tetris-battle": {
    id: "tetris-battle",
    minPlayers: 2,
    playerAction: async (page) => {
      const board = page.getByTestId("tetris-board-touch");
      if (await board.isVisible().catch(() => false)) {
        const box = await board.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2);
          await page.mouse.up();
        }
      }
    },
  },
  battleships: {
    id: "battleships",
    minPlayers: 2,
    playerAction: async (page) => {
      const random = page.getByTestId("battleship-random");
      if (await random.isVisible().catch(() => false)) await random.click();
      await page.getByTestId("battleship-ready").click({ timeout: 20_000 });
    },
  },
  "connect-four": {
    id: "connect-four",
    minPlayers: 2,
    playerAction: async (page) => {
      await page.getByTestId("connect-four-col-0").click({ timeout: 15_000 });
    },
  },
  "tic-tac-toe": {
    id: "tic-tac-toe",
    minPlayers: 2,
    playerAction: async (page) => {
      await page.getByTestId("tic-tac-toe-cell-0").click({ timeout: 15_000 });
    },
  },
};
