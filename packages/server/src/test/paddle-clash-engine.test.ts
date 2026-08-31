import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createPaddleClashState,
  onPaddleClashTick,
  PADDLE_POINTS_PER_GOAL,
  PADDLE_WIN_BONUS,
} from "../engines/paddle-clash-engine.js";
import { createPaddleState } from "@party-games/shared";

describe("paddle-clash scoring", () => {
  it("awards points per goal plus win bonus", () => {
    const state = createPaddleClashState(["p1", "p2"], "pong");
    state.phase = "playing";
    state.paddle = createPaddleState(["p1", "p2"], "pong");
    state.paddle.players[0].score = 7;
    state.paddle.players[1].score = 4;

    const ended = onPaddleClashTick(state);
    assert.equal(ended.phase, "ended");
    assert.equal(ended.roundScores.p1, 7 * PADDLE_POINTS_PER_GOAL + PADDLE_WIN_BONUS);
    assert.equal(ended.roundScores.p2, 4 * PADDLE_POINTS_PER_GOAL);
  });
});
