import type { GameId } from "../../packages/shared/src/constants.ts";
import type { GameE2EConfig } from "./room.js";

export const NEW_GAME_IDS = [
  "split-the-room",
  "spectrum",
  "chain-sketch",
  "crowd-call",
  "star-rate",
  "impostor",
  "agent-grid",
  "forbidden-clue",
  "hangman-race",
  "paddle-clash",
  "grid-blast",
] as const satisfies readonly GameId[];

export type NewGameId = (typeof NEW_GAME_IDS)[number];

export const GAME_MAX_PLAYERS: Partial<Record<GameId, number>> = {
  "fact-check": 16,
  "wit-showdown": 16,
  "quick-quiz": 16,
  "would-you-rather": 16,
  "caption-this": 16,
  "draw-guess": 12,
  "bracket-battle": 16,
  "role-sort": 8,
  timeline: 16,
  impostor: 8,
  "trail-dash": 8,
  "word-rush": 16,
  "reverse-fact": 16,
  "team-charades": 12,
  "hot-seat": 10,
  "last-on-the-dike": 16,
  "block-stack": 8,
  "fleet-duel": 8,
  "four-in-a-row": 4,
  "tic-tac-toe": 8,
  "split-the-room": 16,
  spectrum: 12,
  "chain-sketch": 8,
  "crowd-call": 16,
  "star-rate": 16,
  "agent-grid": 12,
  "forbidden-clue": 12,
  "hangman-race": 16,
  "paddle-clash": 4,
  "grid-blast": 8,
};

export function midPlayerCount(config: GameE2EConfig): number {
  const max = config.maxPlayers ?? GAME_MAX_PLAYERS[config.id] ?? config.minPlayers;
  return Math.max(config.minPlayers, Math.ceil((config.minPlayers + max) / 2));
}

async function roleSortAction(page: import("@playwright/test").Page) {
  const selects = page.locator('[data-testid^="role-sort-assign-"]');
  const count = await selects.count();
  for (let i = 0; i < count; i++) {
    await selects.nth(i).selectOption({ index: 1 });
  }
  const submit = page.getByTestId("role-sort-submit");
  if (await submit.isEnabled().catch(() => false)) await submit.click();
}

async function fleetDuelAction(page: import("@playwright/test").Page) {
  const random = page.getByTestId("fleet-duel-random");
  if (await random.isVisible().catch(() => false)) await random.click();
  const ready = page.getByTestId("fleet-duel-ready");
  if (await ready.isVisible().catch(() => false)) await ready.click();
}

async function submitText(page: import("@playwright/test").Page) {
  const input = page.getByTestId("player-text-input");
  if (await input.isVisible().catch(() => false)) {
    await input.fill("Test answer");
    await page.getByTestId("player-submit").click();
    return;
  }
  await page.getByRole("button").first().click({ timeout: 5000 }).catch(() => {});
}

async function drawOnCanvas(page: import("@playwright/test").Page) {
  const canvas = page.getByTestId("draw-canvas");
  if (await canvas.isVisible().catch(() => false)) {
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 40, box.y + 40);
      await page.mouse.down();
      await page.mouse.move(box.x + 120, box.y + 80);
      await page.mouse.up();
    }
    const done = page.getByRole("button", { name: /done drawing/i });
    if (await done.isVisible().catch(() => false)) await done.click();
    return;
  }
  await submitText(page);
}

export const GAME_E2E_CONFIGS: Record<GameId, GameE2EConfig> = {
  "fact-check": { id: "fact-check", minPlayers: 2, playerAction: submitText },
  "wit-showdown": { id: "wit-showdown", minPlayers: 3, playerAction: submitText },
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
    playerAction: roleSortAction,
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
      const accuse = page.getByRole("button", { name: /accuse|guess/i }).first();
      if (await accuse.isVisible().catch(() => false)) await accuse.click();
    },
  },
  "trail-dash": {
    id: "trail-dash",
    minPlayers: 1,
    setupHost: async (host) => {
      const addBot = host.getByRole("button", { name: /add bot/i });
      if (await addBot.isVisible().catch(() => false)) await addBot.click();
    },
    playerAction: async (page) => {
      await page.getByTestId("trail-dash-turn-left").click({ timeout: 15_000 }).catch(() => {});
    },
  },
  "word-rush": { id: "word-rush", minPlayers: 2, playerAction: submitText },
  "reverse-fact": { id: "reverse-fact", minPlayers: 2, playerAction: submitText },
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
  "block-stack": {
    id: "block-stack",
    minPlayers: 2,
    playerAction: async (page) => {
      const board = page.getByTestId("block-stack-board-touch");
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
  "fleet-duel": {
    id: "fleet-duel",
    minPlayers: 2,
    playerAction: fleetDuelAction,
  },
  "four-in-a-row": {
    id: "four-in-a-row",
    minPlayers: 2,
    playerAction: async (page) => {
      await page.getByTestId("four-in-a-row-col-0").click({ timeout: 15_000 });
    },
  },
  "tic-tac-toe": {
    id: "tic-tac-toe",
    minPlayers: 2,
    playerAction: async (page) => {
      await page.getByTestId("tic-tac-toe-cell-0").click({ timeout: 15_000 });
    },
  },
  "split-the-room": {
    id: "split-the-room",
    minPlayers: 3,
    playerAction: async (page) => {
      const voteA = page.getByTestId("split-vote-a");
      if (await voteA.isVisible().catch(() => false)) {
        await voteA.click();
        return;
      }
      await submitText(page);
    },
  },
  spectrum: {
    id: "spectrum",
    minPlayers: 3,
    playerAction: async (page) => {
      const slider = page.getByTestId("spectrum-slider");
      if (await slider.isVisible().catch(() => false)) {
        await slider.fill("60");
        await page.getByTestId("spectrum-lock-in").click();
        return;
      }
      await submitText(page);
    },
  },
  "chain-sketch": {
    id: "chain-sketch",
    minPlayers: 3,
    playerAction: drawOnCanvas,
  },
  "crowd-call": {
    id: "crowd-call",
    minPlayers: 3,
    playerAction: async (page) => {
      const option = page.getByTestId("crowd-call-option-0");
      if (await option.isVisible().catch(() => false)) {
        await option.click();
        return;
      }
      await page.getByRole("button").first().click({ timeout: 15_000 }).catch(() => {});
    },
  },
  "star-rate": {
    id: "star-rate",
    minPlayers: 3,
    playerAction: async (page) => {
      const star = page.getByTestId("star-rate-3");
      if (await star.isVisible().catch(() => false)) {
        await star.click();
        return;
      }
      await submitText(page);
    },
  },
  "agent-grid": {
    id: "agent-grid",
    minPlayers: 4,
    playerAction: async (page) => {
      const tile = page.getByTestId("agent-grid-tile-0");
      if (await tile.isVisible().catch(() => false)) {
        await tile.click();
        return;
      }
      const clueInput = page.getByPlaceholder(/clue/i);
      if (await clueInput.isVisible().catch(() => false)) {
        await clueInput.fill("test");
        await page.getByRole("button", { name: /give clue/i }).click();
      }
    },
  },
  "forbidden-clue": {
    id: "forbidden-clue",
    minPlayers: 4,
    playerAction: async (page) => {
      const got = page.getByTestId("forbidden-got-it");
      if (await got.isVisible().catch(() => false)) await got.click();
    },
  },
  "hangman-race": {
    id: "hangman-race",
    minPlayers: 2,
    playerAction: async (page) => {
      const key = page.getByTestId("hangman-key-e");
      if (await key.isVisible().catch(() => false)) {
        await key.click();
        return;
      }
      await page.getByRole("button", { name: /^e$/i }).first().click({ timeout: 15_000 }).catch(() => {});
    },
  },
  "paddle-clash": {
    id: "paddle-clash",
    minPlayers: 2,
    playerAction: async (page) => {
      const slider = page.getByTestId("paddle-move");
      if (await slider.isVisible().catch(() => false)) {
        await slider.fill("30");
        await slider.fill("70");
      }
    },
  },
  "grid-blast": {
    id: "grid-blast",
    minPlayers: 2,
    playerAction: async (page) => {
      await page.getByTestId("grid-blast-bomb").click({ timeout: 15_000 }).catch(() => {});
      await page.getByTestId("grid-blast-up").click({ timeout: 5_000 }).catch(() => {});
    },
  },
};
