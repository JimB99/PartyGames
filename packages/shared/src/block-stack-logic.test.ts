import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyBlockStackInput,
  blockStackGravityIntervalTicks,
  blockStackGridLayout,
  blockStackLevelFromElapsed,
  canPlace,
  cloneBlockStackPlayer,
  createBlockStackPlayer,
  createBlockStackState,
  LINE_SCORES,
  resetBlockStackRound,
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

  it("blockStackGridLayout returns 2x2 for four players", () => {
    assert.deepEqual(blockStackGridLayout(4), { cols: 2, rows: 2 });
  });

  it("gravity interval decreases as elapsed ticks increase", () => {
    const start = blockStackGravityIntervalTicks(0);
    const later = blockStackGravityIntervalTicks(500);
    assert.ok(start > later);
    assert.ok(blockStackGravityIntervalTicks(10_000) >= 2);
  });

  it("level increases from elapsed ticks", () => {
    assert.equal(blockStackLevelFromElapsed(0), 1);
    assert.equal(blockStackLevelFromElapsed(167), 2);
  });

  it("tickBlockStackState increments elapsedTicks while playing", () => {
    const state = createBlockStackState(["a"]);
    startBlockStackPlaying(state);
    assert.equal(state.elapsedTicks, 0);
    tickBlockStackState(state);
    assert.equal(state.elapsedTicks, 1);
  });

  it("resetBlockStackRound zeroes elapsedTicks", () => {
    const state = createBlockStackState(["a", "b"]);
    startBlockStackPlaying(state);
    state.elapsedTicks = 250;
    const fresh = resetBlockStackRound(state, ["a", "b"]);
    assert.equal(fresh.elapsedTicks, 0);
  });

  it("cloneBlockStackPlayer deep copies board and bag", () => {
    const player = createBlockStackPlayer("a");
    const clone = cloneBlockStackPlayer(player);
    clone.board[0][0] = 99;
    clone.bag.push("I");
    assert.notEqual(player.board[0][0], 99);
    assert.notEqual(player.bag.length, clone.bag.length);
  });
});
