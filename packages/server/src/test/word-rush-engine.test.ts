import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceWordRush,
  createWordRushState,
  scoreWordRush,
} from "../engines/word-rush-engine.js";

describe("word-rush-engine", () => {
  it("accepts dictionary words formable from the letter tiles", () => {
    const state = createWordRushState(1, new Set(["harp"]), 3, 2);
    state.letters = ["H", "A", "R", "P", "E", "F", "N"];
    state.phase = "playing";
    state.submissions = { p1: "harp" };
    scoreWordRush(state);
    assert.equal(state.validWords.p1, true);
    assert.equal(state.roundScores.p1, 400);
  });

  it("rejects tile gibberish not in the dictionary", () => {
    const state = createWordRushState(1, new Set(["harp"]), 3, 2);
    state.letters = ["C", "E", "B", "R", "A", "F", "N"];
    state.phase = "playing";
    state.submissions = { p1: "cebraf" };
    scoreWordRush(state);
    assert.equal(state.validWords.p1, false);
  });

  it("advance from instructions does not immediately end the game", () => {
    let state = createWordRushState(1, new Set(), 3, 2);
    state = advanceWordRush(state);
    assert.equal(state.phase, "playing");
  });
});
