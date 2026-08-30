import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canPlace,
  createBlockStackPlayer,
  createBlockStackState,
  LINE_SCORES,
  startBlockStackPlaying,
  tickBlockStackState,
  type ActivePiece,
} from "./block-stack-logic.js";

describe("block-stack-logic", () => {
  it("canPlace rejects out of bounds", () => {
    const board = Array.from({ length: 16 }, () => Array(8).fill(0));
    const piece: ActivePiece = { kind: "I", rotation: 0, x: 6, y: 0 };
    assert.equal(canPlace(board, piece), false);
  });

  it("line clear scoring constant", () => {
    assert.equal(LINE_SCORES[1], 100);
    assert.equal(LINE_SCORES[4], 800);
  });

  it("eliminates players when board fills", () => {
    const state = createBlockStackState(["a", "b"]);
    startBlockStackPlaying(state);
    for (const p of state.players) {
      p.alive = false;
    }
    state.players[0].alive = true;
    state.players[1].alive = false;
    state.deathOrder = ["b"];
    tickBlockStackState(state);
    assert.equal(state.phase, "round_end");
  });
});
