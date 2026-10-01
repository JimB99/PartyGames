import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { drainDasAxis, parseBlockStackGesture } from "./block-stack-gestures.js";

describe("parseBlockStackGesture", () => {
  it("maps tap to rotate", () => {
    assert.equal(parseBlockStackGesture(0, 0), "rotate_cw");
    assert.equal(parseBlockStackGesture(5, -5), "rotate_cw");
  });

  it("maps horizontal swipes to move", () => {
    assert.equal(parseBlockStackGesture(-40, 2), "left");
    assert.equal(parseBlockStackGesture(40, 2), "right");
  });

  it("maps vertical swipes to drop", () => {
    assert.equal(parseBlockStackGesture(2, 40), "soft_drop");
    assert.equal(parseBlockStackGesture(2, -40), "hard_drop");
  });
});

describe("drainDasAxis", () => {
  it("emits multiple rights for an 80px swipe at 24px cells", () => {
    const { steps, remain } = drainDasAxis(80, 24);
    assert.equal(steps, 3);
    assert.equal(remain, 8);
  });

  it("emits lefts for negative travel", () => {
    const { steps } = drainDasAxis(-48, 24);
    assert.equal(steps, -2);
  });
});
