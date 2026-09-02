import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyGridBlastInput,
  createGridBlastState,
  finalizeGridBlastRound,
  tickGridBlastState,
} from "./grid-blast-logic.js";

function eliminate(state: ReturnType<typeof createGridBlastState>, playerId: string): void {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.alive) return;
  player.alive = false;
  player.deathRank = state.deathOrder.length + 1;
  state.deathOrder.push(playerId);
}

describe("grid-blast-logic", () => {
  it("ranks survivor first and eliminated players in death order", () => {
    const state = createGridBlastState(["p1", "p2", "p3"]);
    eliminate(state, "p2");
    eliminate(state, "p3");
    const survivor = state.players.find((p) => p.id === "p1");
    assert.ok(survivor?.alive);
    const scores = finalizeGridBlastRound(state);
    assert.equal(survivor?.deathRank, 3);
    assert.equal(scores.p1, 1000);
    assert.ok(scores.p2 > scores.p3);
  });

  it("scores simultaneous wipe from death order only", () => {
    const state = createGridBlastState(["p1", "p2"]);
    eliminate(state, "p1");
    eliminate(state, "p2");
    const scores = finalizeGridBlastRound(state);
    assert.equal(Object.keys(scores).length, 2);
    assert.ok(scores.p1 > scores.p2);
  });

  it("kicks a bomb in the walk direction when the player has canKick", () => {
    const state = createGridBlastState(["p1", "p2"]);
    const p = state.players[0];
    p.canKick = true;
    p.x = 1;
    p.y = 1;
    p.lastMoveTick = -100;
    for (const x of [1, 2, 3, 4]) state.grid[1][x] = 0;
    state.bombs.push({
      x: 2,
      y: 1,
      ownerId: p.id,
      fuseTicks: 80,
      range: 2,
      exploded: false,
      ownerImmunityTicks: 0,
      kickDx: 0,
      kickDy: 0,
    });
    applyGridBlastInput(state, p.id, "right");
    assert.equal(state.bombs[0].x, 3);
    assert.equal(state.bombs[0].kickDx, 1);
    assert.equal(p.x, 2);
  });

  it("does not walk onto a bomb without kick", () => {
    const state = createGridBlastState(["p1", "p2"]);
    const p = state.players[0];
    p.canKick = false;
    p.x = 1;
    p.y = 1;
    p.lastMoveTick = -100;
    state.grid[1][1] = 0;
    state.grid[1][2] = 0;
    state.bombs.push({
      x: 2,
      y: 1,
      ownerId: p.id,
      fuseTicks: 80,
      range: 2,
      exploded: false,
      ownerImmunityTicks: 0,
      kickDx: 0,
      kickDy: 0,
    });
    applyGridBlastInput(state, p.id, "right");
    assert.equal(p.x, 1);
    assert.equal(state.bombs[0].x, 2);
  });

  it("slides a kicked bomb on subsequent ticks", () => {
    const state = createGridBlastState(["p1", "p2"]);
    for (const x of [1, 2, 3, 4, 5]) state.grid[1][x] = 0;
    state.bombs.push({
      x: 2,
      y: 1,
      ownerId: "p1",
      fuseTicks: 80,
      range: 2,
      exploded: false,
      ownerImmunityTicks: 0,
      kickDx: 1,
      kickDy: 0,
    });
    for (let i = 0; i < 4; i++) tickGridBlastState(state);
    assert.ok(state.bombs[0].x > 2);
  });
});
