import { ALL_GAME_IDS, type GameId } from "../../packages/shared/src/constants.ts";
import { GAME_INTERACTIONS } from "./game-interactions.ts";
import { dismissProfileModal, playerScope } from "./player-ui.ts";
import { clickInteraction, type GameE2EConfig } from "./room.js";

export const GAME_MAX_PLAYERS: Partial<Record<GameId, number>> = {
  bluff: 16,
  "prompt-vote": 16,
  opinions: 16,
  spectrum: 12,
  impostor: 10,
  "agent-grid": 12,
  "bracket-battle": 16,
  "forbidden-clue": 12,
  "team-charades": 12,
  "last-on-the-dike": 16,
  trivia: 16,
  drawing: 12,
  "trail-dash": 8,
  "word-rush": 16,
  "block-stack": 8,
  "fleet-duel": 8,
  "four-in-a-row": 4,
  "tic-tac-toe": 8,
  "hangman-race": 16,
  "paddle-clash": 4,
  "grid-blast": 8,
};

export function midPlayerCount(config: GameE2EConfig): number {
  const max = config.maxPlayers ?? GAME_MAX_PLAYERS[config.id] ?? config.minPlayers;
  return Math.max(config.minPlayers, Math.ceil((config.minPlayers + max) / 2));
}

async function fleetDuelAction(page: import("@playwright/test").Page) {
  const random = page.getByTestId("fleet-duel-random");
  if (await random.isVisible().catch(() => false)) await random.click();
  const ready = page.getByTestId("fleet-duel-ready");
  if (await ready.isVisible().catch(() => false)) await ready.click();
}

async function clickFirstBluffVote(page: import("@playwright/test").Page): Promise<boolean> {
  const locked = await page.getByText(/Submitted!|Locked in!|Vote locked/i).isVisible().catch(() => false);
  if (locked) return true;
  const options = playerScope(page).locator("button").filter({
    hasNotText: /^(join|skip|pause|save|cancel|edit|submit)$/i,
  });
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const btn = options.nth(i);
    if (!(await btn.isVisible().catch(() => false))) continue;
    const text = (await btn.innerText().catch(() => "")).trim();
    if (text.length < 2) continue;
    try {
      await btn.click({ timeout: 3_000 });
      return true;
    } catch {
      // Phase may have advanced while clicking.
    }
  }
  return false;
}

async function submitText(page: import("@playwright/test").Page, strict = true) {
  await dismissProfileModal(page);
  const input = page.getByTestId("player-text-input");
  if (await input.isVisible().catch(() => false)) {
    await input.fill("Test answer");
    await page.getByTestId("player-submit").click();
    return;
  }
  const clicked =
    (await clickInteraction(page, "wyr-choice-a")) ||
    (await clickInteraction(page, "crowd-call-option-0")) ||
    (await clickInteraction(page, "split-vote-a")) ||
    (await clickFirstBluffVote(page));
  if (!clicked && strict) {
    throw new Error("no submitText or vote control visible");
  }
}

async function drawOnCanvas(page: import("@playwright/test").Page, strict = true) {
  await dismissProfileModal(page);
  if (await page.getByText(/you're the drawer|others are guessing your drawing/i).isVisible().catch(() => false)) {
    return;
  }
  const canvas = page.getByTestId("draw-canvas");
  const visible = await canvas
    .waitFor({ state: "visible", timeout: strict ? 15_000 : 10_000 })
    .then(() => true)
    .catch(() => false);
  if (visible) {
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
  const guessInput = page.getByTestId("player-text-input");
  if (await guessInput.isVisible().catch(() => false)) {
    await guessInput.fill("house");
    await page.getByTestId("player-submit").click({ timeout: 5_000 });
    return;
  }
  await submitText(page, strict);
}

export const GAME_E2E_CONFIGS: Record<GameId, GameE2EConfig> = {
  bluff: { id: "bluff", minPlayers: 2, playerAction: submitText },
  "prompt-vote": { id: "prompt-vote", minPlayers: 3, playerAction: submitText },
  opinions: {
    id: "opinions",
    minPlayers: 3,
    playerAction: async (page, strict) => {
      const clicked =
        (await clickInteraction(page, "wyr-choice-a")) ||
        (await clickInteraction(page, "crowd-call-option-0")) ||
        (await clickInteraction(page, "split-vote-a"));
      if (strict && !clicked) await submitText(page, strict);
    },
  },
  spectrum: {
    id: "spectrum",
    minPlayers: 3,
    playerAction: async (page, strict) => {
      const clue = page.getByPlaceholder(/your clue/i);
      if (await clue.isVisible().catch(() => false)) {
        await clue.fill("Test clue");
        await page.getByRole("button", { name: /submit clue/i }).click();
        return;
      }
      const slider = page.getByTestId("spectrum-slider");
      if (await slider.isVisible().catch(() => false)) {
        await slider.fill("60");
        await page.getByTestId("spectrum-lock-in").click();
        return;
      }
      if (strict) throw new Error("no spectrum control visible");
    },
  },
  impostor: {
    id: "impostor",
    minPlayers: 4,
    playerAction: async (page, strict) => {
      if (await page.getByTestId("draw-canvas").isVisible().catch(() => false)) {
        await drawOnCanvas(page, strict);
        return;
      }
      const accuse = page.getByRole("button", { name: /accuse|guess/i }).first();
      if (await accuse.isVisible().catch(() => false)) await accuse.click();
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
  "bracket-battle": { id: "bracket-battle", minPlayers: 4, playerAction: submitText },
  "forbidden-clue": {
    id: "forbidden-clue",
    minPlayers: 4,
    playerAction: async (page) => {
      const got = page.getByTestId("forbidden-got-it");
      if (await got.isVisible().catch(() => false)) await got.click();
    },
  },
  "team-charades": {
    id: "team-charades",
    minPlayers: 3,
    playerAction: async (page, strict) => {
      const clicked = await clickInteraction(page, "charades-correct");
      if (strict && !clicked) throw new Error("charades-correct not visible");
    },
  },
  "last-on-the-dike": {
    id: "last-on-the-dike",
    minPlayers: 4,
    playerAction: async (page, strict) => {
      const clicked = await clickInteraction(page, "dike-bid-submit");
      if (strict && !clicked) throw new Error("dike-bid-submit not visible");
    },
  },
  trivia: {
    id: "trivia",
    minPlayers: 1,
    playerAction: async (page, strict) => {
      const quiz = await clickInteraction(page, "player-answer-0");
      if (quiz) return;
      const timeline = await clickInteraction(page, "timeline-lock-in");
      if (strict && !timeline) throw new Error("no trivia control visible");
    },
  },
  drawing: {
    id: "drawing",
    minPlayers: 3,
    playerAction: (page, strict) => drawOnCanvas(page, strict),
  },
  "trail-dash": {
    id: "trail-dash",
    minPlayers: 1,
    setupHost: async (host) => {
      const addBot = host.getByRole("button", { name: /add bot/i });
      if (await addBot.isVisible().catch(() => false)) await addBot.click();
    },
    playerAction: async (page, strict) => {
      const clicked = await clickInteraction(page, "trail-dash-turn-left");
      if (strict && !clicked) throw new Error("trail-dash-turn-left not visible");
    },
  },
  "word-rush": { id: "word-rush", minPlayers: 2, playerAction: submitText },
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
    playerAction: async (page, strict) => {
      const cells = page.locator('[data-testid^="tic-tac-toe-cell-"]:not([disabled])');
      const count = await cells.count();
      if (count > 0) {
        await cells.first().click({ timeout: 15_000 });
        return;
      }
      if (strict) throw new Error("no enabled tic-tac-toe cell");
    },
  },
  "hangman-race": {
    id: "hangman-race",
    minPlayers: 2,
    playerAction: async (page, strict) => {
      const clicked = await clickInteraction(page, "hangman-key-e");
      if (strict && !clicked) throw new Error("hangman-key-e not visible");
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
    playerAction: async (page, strict) => {
      const bomb = await clickInteraction(page, "grid-blast-bomb");
      const up = await clickInteraction(page, "grid-blast-up");
      if (strict && !bomb && !up) throw new Error("grid-blast controls not visible");
    },
  },
};

for (const id of ALL_GAME_IDS) {
  GAME_E2E_CONFIGS[id].interactions = GAME_INTERACTIONS[id];
}

/** Consolidated games — extra mid-player E2E coverage in all-games.full.spec.ts */
export const NEW_GAME_IDS: GameId[] = [
  "bluff",
  "trivia",
  "prompt-vote",
  "opinions",
  "drawing",
  "impostor",
];

/** Try each listed player interaction control (best-effort per phase). */
export async function runPlayerInteractions(
  page: import("@playwright/test").Page,
  gameId: GameId,
): Promise<void> {
  const ids = GAME_INTERACTIONS[gameId].player;
  for (const testId of ids) {
    await clickInteraction(page, testId);
  }
}
