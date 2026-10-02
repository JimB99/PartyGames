import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { onAgentGridAction, createAgentGridState, padGrid } from "../engines/agent-grid-engine.js";
import { AGENT_GRID_SIZE } from "@party-games/shared";
import { makeRoomContext } from "./harness.js";

describe("agent-grid-engine padGrid", () => {
  it("fills every cell when the word pool is shorter than the grid", () => {
    const grid = padGrid(["one", "two", "three"]);
    assert.equal(grid.length, AGENT_GRID_SIZE);
    for (const word of grid) {
      assert.equal(typeof word, "string");
      assert.ok(word.length > 0);
    }
  });

  it("uses each available word at least once when padding", () => {
    const grid = padGrid(["one", "two", "three"]);
    for (const word of ["one", "two", "three"]) {
      assert.ok(grid.includes(word), `missing ${word}`);
    }
  });

  it("does not repeat words when the pool is large enough", () => {
    const words = Array.from({ length: 40 }, (_, i) => `word${i}`);
    const grid = padGrid(words);
    assert.equal(new Set(grid).size, AGENT_GRID_SIZE);
  });

  it("throws rather than building a grid of holes with no words", () => {
    assert.throws(() => padGrid([]), /no words available/);
  });
});

describe("agent-grid-engine", () => {
  it("rejects guessing an already revealed cell", () => {
    const ctx = makeRoomContext(4);
    let state = createAgentGridState(
      Array.from({ length: 25 }, (_, i) => `word${i}`),
      ctx.playerIds,
    );
    state.phase = "guess";
    state.activeTeam = "a";
    state.teamA = ctx.playerIds.slice(0, 2);
    state.teamB = ctx.playerIds.slice(2);
    state.spymasterA = state.teamA[0];
    state.spymasterB = state.teamB[0];
    state.currentClue = { word: "test", count: 1 };
    state.guessesRemaining = 2;
    state.revealed[0] = true;
    const guesser = state.teamA[1];
    const before = [...state.revealed];
    state = onAgentGridAction(state, guesser, { kind: "agent_guess", index: 0 }, ctx);
    assert.deepEqual(state.revealed, before);
  });
});
