import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createChainSketchState } from "../engines/chain-sketch-engine.js";

describe("chain-sketch-engine", () => {
  it("seeds with a real word from the pool", () => {
    const state = createChainSketchState(["pizza", "dragon", "rocket"], ["p1", "p2", "p3"]);
    assert.ok(state.currentPrompt.length > 1);
    assert.notEqual(state.currentPrompt, "?");
  });
});
