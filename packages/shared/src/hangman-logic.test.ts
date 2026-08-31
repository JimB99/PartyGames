import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tryHangmanSolve, createHangmanPlayerState } from "./hangman-logic.js";

describe("hangman-logic", () => {
  it("empty solve is a no-op (no strikes)", () => {
    const state = createHangmanPlayerState("hello");
    const next = tryHangmanSolve(state, "   ");
    assert.equal(next.strikes, 0);
    assert.equal(next.solved, false);
  });

  it("wrong solve costs 2 strikes", () => {
    const state = createHangmanPlayerState("hello");
    const next = tryHangmanSolve(state, "world");
    assert.equal(next.strikes, 2);
  });
});
