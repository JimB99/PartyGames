import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseTetrisGesture } from "./tetris-gestures.js";

describe("parseTetrisGesture", () => {
  it("maps tap to rotate", () => {
    assert.equal(parseTetrisGesture(0, 0), "rotate_cw");
    assert.equal(parseTetrisGesture(5, -5), "rotate_cw");
  });

  it("maps horizontal swipes to move", () => {
    assert.equal(parseTetrisGesture(-40, 2), "left");
    assert.equal(parseTetrisGesture(40, 2), "right");
  });

  it("maps vertical swipes to drop", () => {
    assert.equal(parseTetrisGesture(2, 40), "soft_drop");
    assert.equal(parseTetrisGesture(2, -40), "hard_drop");
  });
});
