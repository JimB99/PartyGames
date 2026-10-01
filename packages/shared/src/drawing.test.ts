import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ERASER_WIDTH_MULTIPLIER, ackPendingIds, allDrawersReady, chunkStrokePoints, isEraseStroke, shouldAcceptStroke, simplifyStrokePoints, strokeLineWidth } from "./drawing.js";

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

describe("chunkStrokePoints", () => {
  it("keeps short strokes as a single chunk", () => {
    assert.deepEqual(chunkStrokePoints([0, 0, 1, 1], 64), [[0, 0, 1, 1]]);
  });

  it("splits oversize strokes into chunks of at most max pairs", () => {
    const points = Array.from({ length: 140 }, (_, i) => i / 140);
    const chunks = chunkStrokePoints(points, 64);
    assert.ok(chunks.length >= 2);
    for (const chunk of chunks) {
      assert.ok(chunk.length <= 128);
      assert.ok(chunk.length >= 2);
    }
  });
});

describe("ackPendingIds", () => {
  it("acks by stroke id instead of array length", () => {
    const remaining = ackPendingIds(["a", "b"], [{ id: "a" }, { id: "other" }]);
    assert.deepEqual(remaining, ["b"]);
  });
});

describe("shouldAcceptStroke", () => {
  it("rejects strokes from before a clear/undo revision", () => {
    assert.equal(shouldAcceptStroke(0, 1), false);
    assert.equal(shouldAcceptStroke(1, 1), true);
    assert.equal(shouldAcceptStroke(undefined, 0), true);
  });
});

describe("allDrawersReady", () => {
  it("requires every connected drawer", () => {
    assert.equal(allDrawersReady({ p1: true }, ["p1", "p2", "p3"]), false);
    assert.equal(allDrawersReady({ p1: true, p2: true, p3: true }, ["p1", "p2", "p3"]), true);
  });
});
