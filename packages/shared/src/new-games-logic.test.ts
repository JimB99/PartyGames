import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyHangmanLetter,
  createHangmanPlayerState,
  hangmanMask,
  tryHangmanSolve,
} from "./hangman-logic.js";
import { buildAgentKey, resolveAgentGuess } from "./agent-grid-logic.js";
import { createPaddleState, tickPaddleState } from "./paddle-clash-logic.js";
import { applyGridBlastInput, createGridBlastState, tickGridBlastState } from "./grid-blast-logic.js";

describe("hangman-logic", () => {
  it("reveals matching letters", () => {
    const s = createHangmanPlayerState("apple");
    const next = applyHangmanLetter(s, "p");
    assert.equal(hangmanMask("apple", next.guessed), "_ P P _ _");
  });

  it("solve awards completion", () => {
    let s = createHangmanPlayerState("cat");
    s = applyHangmanLetter(s, "c");
    s = applyHangmanLetter(s, "a");
    s = applyHangmanLetter(s, "t");
    assert.equal(s.solved, true);
  });

  it("wrong solve adds strikes", () => {
    const s = tryHangmanSolve(createHangmanPlayerState("cat"), "dog");
    assert.equal(s.strikes, 2);
  });
});

describe("agent-grid-logic", () => {
  it("builds 25 tiles", () => {
    const key = buildAgentKey("a");
    assert.equal(key.length, 25);
    assert.equal(key.filter((t) => t === "assassin").length, 1);
  });

  it("assassin ends game", () => {
    const key = buildAgentKey("a");
    const idx = key.indexOf("assassin");
    const revealed = Array(25).fill(false);
    const r = resolveAgentGuess(key, revealed, idx, "a");
    assert.equal(r.outcome, "assassin_loss");
  });
});

describe("paddle-clash-logic", () => {
  it("ticks without throwing", () => {
    const state = createPaddleState(["a", "b"], "pong");
    const next = tickPaddleState(state);
    assert.ok(next.ball.x >= 0 && next.ball.x <= 1);
  });
});

describe("grid-blast-logic", () => {
  it("places bomb", () => {
    const state = createGridBlastState(["a", "b"]);
    const p = state.players[0];
    applyGridBlastInput(state, p.id, "bomb");
    assert.equal(state.bombs.length, 1);
  });

  it("ticks bombs down", () => {
    const state = createGridBlastState(["a", "b"]);
    applyGridBlastInput(state, state.players[0].id, "bomb");
    const fuse = state.bombs[0].fuseTicks;
    tickGridBlastState(state);
    assert.ok(state.bombs[0].fuseTicks < fuse);
  });
});
