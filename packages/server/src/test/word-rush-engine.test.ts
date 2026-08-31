import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceWordRush,
  createWordRushState,
  onWordRushAction,
  scoreWordRush,
} from "../engines/word-rush-engine.js";

describe("word-rush-engine", () => {
  it("accepts words formable from the letter tiles without dictionary lookup", () => {
    const state = createWordRushState(1, new Set(["zzzzzz"]), 3, 2);
    state.letters = ["H", "A", "R", "P", "E", "F", "N"];
    state.phase = "playing";
    state.submissions = { p1: "harp" };
    scoreWordRush(state);
    assert.equal(state.validWords.p1, true);
    assert.equal(state.roundScores.p1, 400);
  });

  it("advance from instructions does not immediately end the game", () => {
    let state = createWordRushState(1, new Set(), 3, 2);
    state = advanceWordRush(state);
    assert.equal(state.phase, "playing");
  });
});
