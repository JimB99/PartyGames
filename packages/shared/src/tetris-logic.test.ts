import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canPlace,
  createTetrisPlayer,
  createTetrisState,
  LINE_SCORES,
  startTetrisPlaying,
  tickTetrisState,
  type ActivePiece,
} from "./tetris-logic.js";

describe("tetris-logic", () => {
  it("canPlace rejects out of bounds", () => {
    const board = Array.from({ length: 20 }, () => Array(10).fill(0));
    const piece: ActivePiece = { kind: "I", rotation: 0, x: 8, y: 0 };
    assert.equal(canPlace(board, piece), false);
  });

  it("line clear scoring constant", () => {
    assert.equal(LINE_SCORES[1], 100);
    assert.equal(LINE_SCORES[4], 800);
  });

  it("eliminates players when board fills", () => {
    const state = createTetrisState(["a", "b"]);
    startTetrisPlaying(state);
    for (const p of state.players) {
      p.alive = false;
    }
    state.players[0].alive = true;
    state.players[1].alive = false;
    state.deathOrder = ["b"];
    tickTetrisState(state);
    assert.equal(state.phase, "round_end");
  });
});
