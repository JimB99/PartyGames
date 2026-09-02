import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceChain,
  createChainSketchState,
  onChainAction,
} from "../engines/chain-sketch-engine.js";

const ctx = { playerIds: ["p1", "p2", "p3"], hostId: "host" };

describe("chain-sketch-engine", () => {
  it("seeds each player with a starting word and simultaneous workspaces", () => {
    const state = createChainSketchState(["pizza", "dragon", "rocket"], ["p1", "p2", "p3"]);
    assert.ok(state.chains.p1.startWord.length > 1);
    assert.ok(state.workspaces.p1);
    assert.equal(state.stagesTotal, 6);
    assert.equal(state.workspaces.p1.chainOwnerId, "p1");
    assert.equal(state.workspaces.p2.chainOwnerId, "p2");
    assert.equal(state.workspaces.p3.chainOwnerId, "p3");
  });

  it("rotates chain assignment each stage (derangement)", () => {
    let state = createChainSketchState(["a", "b", "c"], ["p1", "p2", "p3"]);
    state = advanceChain(state);
    assert.equal(state.phase, "draw");
    assert.equal(state.workspaces.p1.chainOwnerId, "p1");
    for (const pid of state.playerIds) {
      state = onChainAction(state, pid, { kind: "advance" }, ctx);
    }
    assert.equal(state.phase, "guess");
    assert.equal(state.workspaces.p1.chainOwnerId, "p2");
    assert.equal(state.workspaces.p2.chainOwnerId, "p3");
    assert.equal(state.workspaces.p3.chainOwnerId, "p1");
  });
});
