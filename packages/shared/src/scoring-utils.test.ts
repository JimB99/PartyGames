import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveWinnerId } from "./scoring-utils.js";

describe("resolveWinnerId", () => {
  it("prefers explicit winner fields over score leader", () => {
    assert.equal(resolveWinnerId({ roundWinner: "a" }, { b: 999 }), "a");
    assert.equal(resolveWinnerId({ winnerId: "x" }, {}), "x");
    assert.equal(resolveWinnerId({ championId: "y" }, {}), "y");
  });

  it("falls back to highest score", () => {
    assert.equal(resolveWinnerId({}, { a: 100, b: 200 }), "b");
  });

  it("returns null when no winner data", () => {
    assert.equal(resolveWinnerId({}, {}), null);
  });
});
