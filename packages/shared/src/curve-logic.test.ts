import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  checkTrailCollisions,
  collectPickups,
  createCurveState,
  detonateGrenade,
  movePlayer,
  tickCurveState,
  tryJump,
  wrapThroughHole,
  type CurveState,
} from "./curve-logic.js";
import {
  DEFAULT_TRAIL_DASH_OPTIONS,
  rankPointsForPlace,
} from "./trail-dash-options.js";

function playingState(playerIds: string[]): CurveState {
  const state = createCurveState(playerIds, [], {}, DEFAULT_TRAIL_DASH_OPTIONS);
  state.phase = "playing";
  state.timerEndsAt = Date.now() + 60000;
  return state;
}

describe("curve-logic collision", () => {
  it("does not kill player on first movement tick (no self-collision)", () => {
    const state = playingState(["a", "b"]);
    movePlayer(state.players[0], 0.08);
    checkTrailCollisions(state);
    assert.equal(state.players[0].alive, true);
    movePlayer(state.players[0], 0.08);
    checkTrailCollisions(state);
    assert.equal(state.players[0].alive, true);
  });

  it("jump passes over own trail segment", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    p.trail = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 300, y: 100 },
    ];
    p.x = 200;
    p.y = 95;
    p.jumpTicksRemaining = 10;
    checkTrailCollisions(state);
    assert.equal(p.alive, true);
  });
});

describe("curve-logic scoring", () => {
  it("assigns highest rank points to last survivor", () => {
    const state = playingState(["a", "b", "c"]);
    state.players[0].alive = false;
    state.deathOrder.push("a");
    state.players[1].alive = false;
    state.deathOrder.push("b");
    state.phase = "playing";
    state.timerEndsAt = Date.now() - 1;
    tickCurveState(state);
    assert.equal(state.phase, "round_end");
    assert.equal(state.roundScores["c"], rankPointsForPlace(1, 1));
  });

  it("coin pickup increments player coin tally", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    state.coins = [{ id: "c1", x: p.x, y: p.y }];
    collectPickups(state);
    assert.equal(p.coinsThisRound, DEFAULT_TRAIL_DASH_OPTIONS.coinValue);
    assert.equal(state.coins.length, 0);
  });
});

describe("curve-logic grenade", () => {
  it("removes trail points in radius", () => {
    const state = playingState(["a", "b"]);
    state.players[0].trail = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 300, y: 100 },
      { x: 400, y: 100 },
    ];
    detonateGrenade(state, 250, 100, "b");
    const remaining = state.players[0].trail;
    assert.ok(remaining.length < 4);
    assert.ok(remaining.every((pt) => Math.hypot(pt.x - 250, pt.y - 100) >= 60 || pt === remaining[0]));
  });

  it("kills players inside grenade radius", () => {
    const state = playingState(["a", "b"]);
    state.players[0].x = 200;
    state.players[0].y = 200;
    detonateGrenade(state, 200, 200, "b");
    assert.equal(state.players[0].alive, false);
  });
});

describe("curve-logic wall holes", () => {
  it("wraps player to opposite edge through top hole", () => {
    const hole = { edge: "top" as const, start: 100, length: 80 };
    const wrapped = wrapThroughHole(140, 3, hole, 800, 600);
    assert.equal(wrapped.y, 600 - 5 - 10);
    assert.equal(wrapped.x, 140);
  });
});

describe("curve-logic jump", () => {
  it("respects cooldown", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    assert.equal(tryJump(p), true);
    assert.equal(tryJump(p), false);
  });
});
