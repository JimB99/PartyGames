import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALL_GAME_IDS } from "./constants.js";
import type { GameHostDataMap } from "./game-view-types.js";

describe("game-view-types", () => {
  it("maps every game id to host view data", () => {
    const map = {
      bluff: true,
      "prompt-vote": true,
      opinions: true,
      spectrum: true,
      impostor: true,
      "agent-grid": true,
      "bracket-battle": true,
      "forbidden-clue": true,
      "team-charades": true,
      "last-on-the-dike": true,
      trivia: true,
      drawing: true,
      "trail-dash": true,
      "word-rush": true,
      "block-stack": true,
      "fleet-duel": true,
      "four-in-a-row": true,
      "tic-tac-toe": true,
      "hangman-race": true,
      "paddle-clash": true,
      "grid-blast": true,
    } satisfies Record<keyof GameHostDataMap, true>;

    for (const id of ALL_GAME_IDS) {
      assert.ok(id in map, `missing host data map for ${id}`);
    }
  });
});
