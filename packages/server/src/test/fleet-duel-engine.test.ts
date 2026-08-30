import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allShipsPlaced,
  autoPlaceFleet,
  clearFleetPlacement,
  createFleetDuelState,
} from "@party-games/shared";
import { onFdAction, onFdTick } from "../engines/fleet-duel-engine.js";

describe("fleet-duel-engine placement", () => {
  it("starts placement with empty fleets", () => {
    let state = createFleetDuelState(["a", "b"]);
    state = onFdAction(state, "a", { kind: "advance" });
    assert.equal(state.phase, "placement");
    assert.ok(!allShipsPlaced(state.fleets.a));
    assert.ok(!allShipsPlaced(state.fleets.b));
  });

  it("places ships via random then ready", () => {
    let state = createFleetDuelState(["a", "b"]);
    state = onFdAction(state, "a", { kind: "advance" });
    state = onFdAction(state, "a", { kind: "fleet_duel_random" });
    assert.ok(allShipsPlaced(state.fleets.a));
    state = onFdAction(state, "a", { kind: "fleet_duel_ready" });
    assert.equal(state.ready.a, true);
    assert.equal(state.phase, "placement");
  });

  it("auto-places only when timer expires", () => {
    let state = createFleetDuelState(["a", "b"]);
    state = onFdAction(state, "a", { kind: "advance" });
    clearFleetPlacement(state.fleets.a);
    state.timerEndsAt = Date.now() - 1;
    state = onFdTick(state);
    assert.ok(allShipsPlaced(state.fleets.a));
    assert.ok(allShipsPlaced(state.fleets.b));
    assert.equal(state.phase, "battle");
  });
});

describe("fleet-duel-logic placement helpers", () => {
  it("clearFleetPlacement resets ship cells", () => {
    const state = createFleetDuelState(["a"]);
    autoPlaceFleet(state.fleets.a, state.gridSize);
    clearFleetPlacement(state.fleets.a);
    assert.ok(state.fleets.a.ships.every((s) => s.cells.length === 0));
  });
});
