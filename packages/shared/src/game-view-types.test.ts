import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALL_GAME_IDS } from "./constants.js";
import type { GameHostDataMap } from "./game-view-types.js";

describe("game-view-types", () => {
  it("maps every game id to host view data", () => {
    const map = {
      "quick-quiz": true,
      timeline: true,
      "would-you-rather": true,
      "fact-check": true,
      "reverse-fact": true,
      "wit-showdown": true,
      "caption-this": true,
      "hot-seat": true,
      "draw-guess": true,
      "draw-vote": true,
      "draw-impostor": true,
      "bracket-battle": true,
      "role-sort": true,
      impostor: true,
      "trail-dash": true,
      "word-rush": true,
      "team-charades": true,
      "last-on-the-dike": true,
      "block-stack": true,
      "fleet-duel": true,
      "four-in-a-row": true,
      "tic-tac-toe": true,
      "split-the-room": true,
      spectrum: true,
      "chain-sketch": true,
      "crowd-call": true,
      "star-rate": true,
      "agent-grid": true,
      "forbidden-clue": true,
      "hangman-race": true,
      "paddle-clash": true,
      "grid-blast": true,
    } satisfies Record<keyof GameHostDataMap, true>;

    for (const id of ALL_GAME_IDS) {
      assert.ok(id in map, `missing host data map for ${id}`);
    }
  });
});
