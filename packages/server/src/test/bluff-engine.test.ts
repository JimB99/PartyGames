import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { advanceBluff, createBluffState } from "../engines/bluff-engine.js";

const POOL = Array.from({ length: 10 }, (_, i) => ({
  prompt: `Prompt ${i}`,
  truth: `Canonical answer ${i}`,
}));

describe("bluff-engine voting options", () => {
  it("adds house decoys when few player submissions", () => {
    let state = createBluffState("fact-check", POOL, 5, 2);
    state = advanceBluff(state);
    state.submissions = { p1: "Lie one", p2: "Lie two" };
    state = advanceBluff(state);
    assert.ok(state.options.length >= 4);
    const houseDecoys = state.options.filter((o) => o.authorId === "house");
    assert.ok(houseDecoys.length >= 1);
    assert.equal(state.options.filter((o) => o.isTruth).length, 1);
  });

  it("accumulates cumulative scores across rounds", () => {
    let state = createBluffState("fact-check", POOL, 2, 2);
    state = advanceBluff(state);
    state.submissions = { p1: "Lie one", p2: "Lie two" };
    state = advanceBluff(state);
    state.votes = { p1: state.truthId, p2: state.truthId };
    state = advanceBluff(state);
    assert.equal(state.cumulativeScores.p1, 1000);
    assert.equal(state.cumulativeScores.p2, 1000);
    state = advanceBluff(state);
    state = advanceBluff(state);
    state.submissions = { p1: "Lie three", p2: "Lie four" };
    state = advanceBluff(state);
    state.votes = { p1: state.truthId };
    state = advanceBluff(state);
    assert.equal(state.cumulativeScores.p1, 2000);
    assert.equal(state.cumulativeScores.p2, 1000);
  });
});
