import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isEraseStroke } from "./drawing.js";

describe("isEraseStroke", () => {
  it("treats erase flag, erase color, and transparent as eraser", () => {
    assert.equal(isEraseStroke({ color: "#ffffff", erase: true }), true);
    assert.equal(isEraseStroke({ color: "erase" }), true);
    assert.equal(isEraseStroke({ color: "transparent" }), true);
    assert.equal(isEraseStroke({ color: "#ff4d4d" }), false);
  });
});
