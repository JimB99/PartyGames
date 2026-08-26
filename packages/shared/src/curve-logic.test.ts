import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ARENA_H,
  ARENA_W,
  checkTrailCollisions,
  collectPickups,
  createCurveState,
  detonateGrenade,
  fireWeapon,
  movePlayer,
  tickCurveState,
  tickPlayerEffects,
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

  it("does not kill player when steering after a straight run", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    for (let i = 0; i < 30; i++) {
      movePlayer(p, 0.08);
      checkTrailCollisions(state);
    }
    p.direction = "left";
    movePlayer(p, 0.08);
    checkTrailCollisions(state);
    assert.equal(p.alive, true);
  });

  it("still kills on a tight loop back into older trail", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    for (let i = 0; i < 50; i++) {
      movePlayer(p, 0.08);
      checkTrailCollisions(state);
    }
    p.direction = "left";
    let died = false;
    for (let i = 0; i < 90; i++) {
      movePlayer(p, 0.08);
      checkTrailCollisions(state);
      if (!p.alive) {
        died = true;
        break;
      }
    }
    assert.equal(died, true);
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
    const wrapped = wrapThroughHole(140, 3, hole, ARENA_W, ARENA_H);
    assert.equal(wrapped.y, ARENA_H - 5 - 10);
    assert.equal(wrapped.x, 140);
  });
});

describe("curve-logic arena", () => {
  it("uses a larger playfield", () => {
    const state = createCurveState(["a"], [], {}, DEFAULT_TRAIL_DASH_OPTIONS);
    assert.equal(state.width, ARENA_W);
    assert.equal(state.height, ARENA_H);
    assert.ok(state.width > 800);
    assert.ok(state.height > 600);
  });
});

describe("curve-logic trail breaks", () => {
  it("jump leaves a gap in the trail", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    for (let i = 0; i < 10; i++) movePlayer(p, 0.08);
    tryJump(p);
    for (let i = 0; i < 15 + 5; i++) {
      tickPlayerEffects(p);
      movePlayer(p, 0.08);
    }
    assert.ok(p.trail.some((pt) => pt.break));
    const parts: typeof p.trail[] = [];
    let current: typeof p.trail = [];
    for (const pt of p.trail) {
      if (pt.break) {
        if (current.length) parts.push(current);
        current = [];
        continue;
      }
      current.push(pt);
    }
    if (current.length) parts.push(current);
    assert.equal(parts.length, 2);
  });

  it("burst fires five missiles", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    p.heldPowerUp = "burst";
    assert.equal(fireWeapon(state, p), true);
    assert.equal(state.projectiles.length, 5);
  });
});

describe("curve-logic jump", () => {
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

  it("respects cooldown", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    assert.equal(tryJump(p), true);
    assert.equal(tryJump(p), false);
  });
});
