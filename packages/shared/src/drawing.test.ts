import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ERASER_WIDTH_MULTIPLIER, isEraseStroke, simplifyStrokePoints, strokeLineWidth } from "./drawing.js";

describe("simplifyStrokePoints", () => {
  it("reduces collinear points in flat arrays", () => {
    const flat = [0, 0, 0.01, 0.01, 0.02, 0.02, 1, 1];
    const out = simplifyStrokePoints(flat, 0.05);
    assert.ok(out.length <= flat.length);
    assert.equal(out[0], 0);
    assert.equal(out[out.length - 2], 1);
  });
});

describe("isEraseStroke", () => {
  it("treats erase flag, erase color, and transparent as eraser", () => {
    assert.equal(isEraseStroke({ color: "#ffffff", erase: true }), true);
    assert.equal(isEraseStroke({ color: "erase" }), true);
    assert.equal(isEraseStroke({ color: "transparent" }), true);
    assert.equal(isEraseStroke({ color: "#ff4d4d" }), false);
  });
});

describe("strokeLineWidth", () => {
  it("returns base width for pen strokes", () => {
    assert.ok(Math.abs(strokeLineWidth(4, 640, false) - 6.4) < 1e-9);
    assert.ok(Math.abs(strokeLineWidth(12, 480, false) - 14.4) < 1e-9);
  });

  it("returns multiplied width for eraser strokes", () => {
    assert.ok(Math.abs(strokeLineWidth(4, 640, true) - 6.4 * ERASER_WIDTH_MULTIPLIER) < 1e-9);
    assert.ok(Math.abs(strokeLineWidth(12, 480, true) - 14.4 * ERASER_WIDTH_MULTIPLIER) < 1e-9);
  });

  it("applies minimum 2px floor before eraser multiplier", () => {
    assert.equal(strokeLineWidth(1, 100, false), 2);
    assert.equal(strokeLineWidth(1, 100, true), 6);
  });
});
