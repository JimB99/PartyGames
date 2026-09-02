import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { advanceCrowd, createCrowdState } from "../engines/crowd-call-engine.js";

const pool = [{ text: "Pick one", choices: ["A", "B", "C"] }];
const playerIds = ["p1", "p2", "p3", "p4"];

describe("crowd-call-engine", () => {
  it("scores predictions against other players only", () => {
    let state = createCrowdState(pool, playerIds, 1);
    state = advanceCrowd(state, playerIds);
    state.predictions = { p1: 0, p2: 1, p3: 2, p4: 1 };
    state = advanceCrowd(state, playerIds);
    state.answers = { p1: 0, p2: 0, p3: 0, p4: 1 };
    state = advanceCrowd(state, playerIds);
    assert.equal(state.roundScores.p1, 1200);
    assert.equal(state.roundScores.p2, 200);
    assert.equal(state.roundScores.p3, 200);
    assert.equal(state.roundScores.p4, 200);
  });
});
