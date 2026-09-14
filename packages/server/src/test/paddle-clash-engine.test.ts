import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPaddleClashState, paddleClashHostView } from "../engines/paddle-clash-engine.js";

describe("paddle-clash-engine host view", () => {
  it("reports team goals as max teammate score in 2v2, not sum", () => {
    const state = createPaddleClashState(["p1", "p2", "p3", "p4"], "pong");
    state.paddle.players[0].score = 3;
    state.paddle.players[1].score = 4;
    state.paddle.players[2].score = 2;
    state.paddle.players[3].score = 7;

    const view = paddleClashHostView(state);
    assert.equal(view.data.teamGoalsLeft, 4);
    assert.equal(view.data.teamGoalsRight, 7);
    assert.equal(view.data.leftScore, 4);
    assert.equal(view.data.rightScore, 7);
  });
});
