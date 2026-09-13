import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ARENA_H,
  ARENA_W,
  assignSpawnPositions,
  BURST_BULLETS_PER_VOLLEY,
  BURST_VOLLEYS,
  activateHeldPowerUp,
  applyPowerUp,
  checkTrailCollisions,
  collectPickups,
  createCurveState,
  detonateGrenade,
  eraseTrailsInRadius,
  GRENADE_RADIUS,
  HOMING_MISSILE_SPEED,
  JUMP_DURATION_TICKS,
  KANGAROO_JUMP_COOLDOWN_TICKS,
  KANGAROO_JUMP_DURATION_TICKS,
  distanceToWallAlongAngle,
  generateWarpPairs,
  markPlayingStarted,
  movePlayer,
  PLAYABLE_MARGIN,
  portalCenter,
  SPAWN_GRACE_TICKS,
  tickCurveState,
  tickPlayerEffects,
  trailLineSegments,
  tryJump,
  transformAngleThroughPortal,
  warpToPairedPortal,
  type CurveState,
} from "./trail-dash-logic.js";
import {
  DEFAULT_TRAIL_DASH_OPTIONS,
} from "./trail-dash-options.js";
import { rankPointsByPercentile } from "./speed-scoring.js";

function playingState(playerIds: string[]): CurveState {
  const state = createCurveState(playerIds, [], {}, DEFAULT_TRAIL_DASH_OPTIONS);
  state.phase = "playing";
  state.timerEndsAt = Date.now() + 60000;
  state.playingTick = SPAWN_GRACE_TICKS;
  return state;
}

describe("trail-dash-logic collision", () => {
  it("does not kill player on first movement tick (no self-collision)", () => {
    const state = playingState(["a", "b"]);
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

  it("phasing player passes over trail underneath", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    p.trail = [
      { x: 100, y: 100 },
      { x: 400, y: 100 },
    ];
    p.x = 250;
    p.y = 100;
    p.gapTicksRemaining = 20;
    checkTrailCollisions(state);
    assert.equal(p.alive, true);
  });
});

describe("trail-dash-logic scoring", () => {
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
    assert.equal(state.roundScores["c"], rankPointsByPercentile(1, 3, 1));
  });

  it("coin pickup increments player coin tally", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    state.coins = [{ id: "c1", x: p.x, y: p.y }];
    collectPickups(state);
    assert.equal(p.coinsThisRound, DEFAULT_TRAIL_DASH_OPTIONS.coinValue);
  });
});

describe("trail-dash-logic grenade", () => {
  it("inserts trail breaks when erasing a middle section", () => {
    const state = playingState(["a"]);
    state.players[0].trail = [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 300, y: 100 },
      { x: 400, y: 100 },
      { x: 500, y: 100 },
    ];
    eraseTrailsInRadius(state, 300, 100, 60);
    assert.ok(state.players[0].trail.some((pt) => pt.break));
    assert.equal(trailLineSegments(state.players[0].trail).length, 2);
  });

  it("kills players inside grenade radius", () => {
    const state = playingState(["a", "b"]);
    state.players[0].x = 200;
    state.players[0].y = 200;
    detonateGrenade(state, 200, 200, "b");
    assert.equal(state.players[0].alive, false);
  });
});

describe("trail-dash-logic warp pairs", () => {
  it("creates two color-coded portal pairs", () => {
    const portals = generateWarpPairs(ARENA_W, ARENA_H, 42);
    assert.equal(portals.length, 4);
    const pairIds = new Set(portals.map((p) => p.pairId));
    assert.equal(pairIds.size, 2);
    const colors = new Set(portals.map((p) => p.pairColor));
    assert.equal(colors.size, 2);
    assert.ok(portals.every((p) => p.pairLabel === "A" || p.pairLabel === "B"));
    for (const pairId of pairIds) {
      const pair = portals.filter((p) => p.pairId === pairId);
      assert.equal(pair.length, 2);
      assert.notEqual(pair[0].edge, pair[1].edge);
    }
  });

  it("preserves heading relative to portal walls", () => {
    const entry = {
      id: "a",
      pairId: "pair-0",
      pairColor: "#00E5FF",
      pairLabel: "A",
      edge: "top" as const,
      start: 100,
      length: 90,
    };
    const exit = {
      id: "b",
      pairId: "pair-0",
      pairColor: "#00E5FF",
      pairLabel: "A",
      edge: "right" as const,
      start: 200,
      length: 90,
    };
    const headingIntoTop = -Math.PI / 2;
    const out = transformAngleThroughPortal(entry, exit, headingIntoTop);
    assert.ok(Math.abs(out - Math.PI) < 0.001);
  });

  it("warps to the paired portal center", () => {
    const portals = generateWarpPairs(ARENA_W, ARENA_H, 7);
    const entry = portals[0];
    const exit = portals.find((p) => p.pairId === entry.pairId && p.id !== entry.id)!;
    const dest = warpToPairedPortal(entry, portals, ARENA_W, ARENA_H);
    const expected = portalCenter(exit, ARENA_W, ARENA_H);
    assert.equal(dest.x, expected.x);
    assert.equal(dest.y, expected.y);
  });

  it("does not kill player while entering a portal", () => {
    const state = playingState(["a", "b"]);
    const p = state.players[0];
    const entry = state.wallHoles.find((hole) => hole.edge === "top")!;
    p.x = entry.start + entry.length / 2;
    p.y = PLAYABLE_MARGIN - 4;
    p.angle = -Math.PI / 2;
    checkTrailCollisions(state);
    assert.equal(p.alive, true);
    assert.notEqual(p.y, PLAYABLE_MARGIN - 4);
  });

  it("jump phasing passes over another player's trail", () => {
    const state = playingState(["a", "b"]);
    const p = state.players[0];
    const other = state.players[1];
    other.trail = [
      { x: 100, y: 100 },
      { x: 400, y: 100 },
    ];
    p.x = 250;
    p.y = 100;
    p.jumpTicksRemaining = 30;
    checkTrailCollisions(state);
    assert.equal(p.alive, true);
  });

  it("warp does not grant trail phasing", () => {
    const state = playingState(["a", "b"]);
    const p = state.players[0];
    p.phasingTicks = 0;
    const entry = state.wallHoles.find((hole) => hole.edge === "top")!;
    p.x = entry.start + entry.length / 2;
    p.y = PLAYABLE_MARGIN - 4;
    checkTrailCollisions(state);
    assert.equal(p.jumpTicksRemaining, 0);
  });

  it("never places overlapping portals on the same edge", () => {
    for (let seed = 0; seed < 40; seed++) {
      const portals = generateWarpPairs(ARENA_W, ARENA_H, seed);
      const byEdge = new Map<string, WallHole[]>();
      for (const portal of portals) {
        const list = byEdge.get(portal.edge) ?? [];
        list.push(portal);
        byEdge.set(portal.edge, list);
      }
      for (const list of byEdge.values()) {
        const sorted = [...list].sort((a, b) => a.start - b.start);
        for (let i = 1; i < sorted.length; i++) {
          assert.ok(sorted[i].start >= sorted[i - 1].start + sorted[i - 1].length + 20);
        }
      }
    }
  });
});

describe("trail-dash-logic pickups", () => {
  it("starts with no coins and spawns them over time", () => {
    const state = playingState(["a", "b"]);
    assert.equal(state.coins.length, 0);
    for (let i = 0; i < 120; i++) tickCurveState(state);
    assert.ok(state.coins.length > 0);
  });
});

describe("trail-dash-logic bounds", () => {
  it("kills phasing player who leaves the arena", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    p.jumpTicksRemaining = 30;
    p.x = 2;
    p.y = 200;
    checkTrailCollisions(state);
    assert.equal(p.alive, false);
  });
});

describe("trail-dash-logic bot raycast", () => {
  it("treats portal corridors as passable walls", () => {
    const portals = generateWarpPairs(ARENA_W, ARENA_H, 11);
    const topPortal = portals.find((p) => p.edge === "top")!;
    const x = topPortal.start + topPortal.length / 2;
    const y = 40;
    const angle = -Math.PI / 2;
    const wallDist = distanceToWallAlongAngle(x, y, angle, ARENA_W, ARENA_H, portals);
    const noPortalDist = distanceToWallAlongAngle(x, y, angle, ARENA_W, ARENA_H, []);
    assert.ok(wallDist > noPortalDist);
  });
});

describe("trail-dash-logic arena", () => {
  it("uses a larger playfield with warp portals", () => {
    const state = createCurveState(["a"], [], {}, DEFAULT_TRAIL_DASH_OPTIONS);
    assert.equal(state.width, ARENA_W);
    assert.equal(state.height, ARENA_H);
    assert.equal(state.wallHoles.length, 4);
  });
});

describe("trail-dash-logic trail breaks", () => {
  it("jump leaves a gap; phasing ends when jump ends", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    for (let i = 0; i < 10; i++) movePlayer(p, 0.08);
    tryJump(p);
    assert.ok(p.jumpTicksRemaining > 0);
    assert.ok(p.trail.some((pt) => pt.break));
    p.jumpTicksRemaining = 0;
    p.x = 150;
    p.y = 100;
    p.trail = [
      { x: 100, y: 100 },
      { x: 400, y: 100 },
      { x: 400, y: 100, break: true },
      { x: 401, y: 100 },
      { x: 450, y: 100 },
    ];
    checkTrailCollisions(state);
    assert.equal(p.alive, false);
  });

  it("burst fires ten missiles per volley", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    p.heldPowerUp = "burst";
    assert.equal(activateHeldPowerUp(state, p), true);
    assert.equal(state.projectiles.length, BURST_BULLETS_PER_VOLLEY);
    assert.equal(p.burstVolleysRemaining, BURST_VOLLEYS - 1);
  });
});

describe("trail-dash-logic jump", () => {
  it("normal jump uses longer duration", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    assert.equal(tryJump(p), true);
    assert.equal(p.jumpTicksRemaining, JUMP_DURATION_TICKS);
  });

  it("kangaroo held replaces jump with longer leap and 1s cooldown", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    p.heldPowerUp = "double_jump";
    assert.equal(tryJump(p), true);
    assert.equal(p.jumpTicksRemaining, KANGAROO_JUMP_DURATION_TICKS);
    assert.equal(p.jumpCooldownTicks, KANGAROO_JUMP_COOLDOWN_TICKS);
    assert.equal(tryJump(p), false);
    p.jumpCooldownTicks = 0;
    p.jumpTicksRemaining = 0;
    assert.equal(tryJump(p), true);
    assert.equal(p.heldPowerUp, "double_jump");
  });
});

describe("trail-dash-logic power-up equip", () => {
  it("pickup equips held power-up without auto-activating speed", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    state.powerUps = [{ id: "pu1", kind: "speed", x: p.x, y: p.y }];
    collectPickups(state);
    assert.equal(p.heldPowerUp, "speed");
    assert.equal(p.speedEffectTicks, 0);
  });

  it("fire activates speed and clears held power-up", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    p.heldPowerUp = "speed";
    assert.equal(activateHeldPowerUp(state, p), true);
    assert.equal(p.speedEffectTicks > 0, true);
    assert.equal(p.heldPowerUp, null);
  });

  it("homing missile uses slower speed constant", () => {
    const state = playingState(["a"]);
    const p = state.players[0];
    p.heldPowerUp = "missile";
    activateHeldPowerUp(state, p);
    const proj = state.projectiles[0];
    const speed = Math.hypot(proj.vx, proj.vy);
    assert.ok(Math.abs(speed - HOMING_MISSILE_SPEED) < 0.01);
  });

  it("grenade uses enlarged blast radius", () => {
    assert.equal(GRENADE_RADIUS, 90);
  });
});

describe("trail-dash-logic spawn", () => {
  it("assigns unique positions with minimum spacing for 8 players", () => {
    const spawns = assignSpawnPositions(8, ARENA_W, ARENA_H, 42);
    assert.equal(spawns.length, 8);
    for (let i = 0; i < spawns.length; i++) {
      for (let j = i + 1; j < spawns.length; j++) {
        const d = Math.hypot(spawns[i].x - spawns[j].x, spawns[i].y - spawns[j].y);
        assert.ok(d >= 80, `spawns ${i} and ${j} too close: ${d}`);
      }
    }
  });

  it("spawn grace prevents immediate player-vs-player trail death", () => {
    const state = createCurveState(
      ["a", "b"],
      [],
      {},
      DEFAULT_TRAIL_DASH_OPTIONS,
    );
    markPlayingStarted(state, Date.now());
    const a = state.players[0];
    const b = state.players[1];
    a.x = b.x;
    a.y = b.y;
    a.trail = [{ x: a.x, y: a.y }, { x: a.x + 30, y: a.y }];
    b.trail = [{ x: b.x, y: b.y }];
    state.playingTick = 0;
    checkTrailCollisions(state);
    assert.equal(a.alive, true);
    assert.equal(b.alive, true);
  });
});

describe("trail-dash-logic lobby colors", () => {
  it("uses lobby colorIndex for display but distinct spawn positions", () => {
    const state = createCurveState(
      ["human-a"],
      ["bot-b"],
      { "bot-b": "Bot" },
      { maxRounds: 1, roundTimeSec: 60, coinValue: 50, powerUpMode: "normal", botCount: 1 },
      1,
      { "human-a": 5 },
    );
    const human = state.players.find((p) => p.id === "human-a")!;
    const bot = state.players.find((p) => p.id === "bot-b")!;
    assert.equal(human.colorIndex, 5);
    assert.notEqual(human.x, bot.x);
    assert.notEqual(human.y, bot.y);
  });
});
