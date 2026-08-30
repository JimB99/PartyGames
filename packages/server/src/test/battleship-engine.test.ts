import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allShipsPlaced,
  autoPlaceFleet,
  clearFleetPlacement,
  createBattleshipState,
} from "@party-games/shared";
import { onBsAction, onBsTick } from "../engines/battleship-engine.js";

describe("battleship-engine placement", () => {
  it("starts placement with empty fleets", () => {
    let state = createBattleshipState(["a", "b"]);
    state = onBsAction(state, "a", { kind: "advance" });
    assert.equal(state.phase, "placement");
    assert.ok(!allShipsPlaced(state.fleets.a));
    assert.ok(!allShipsPlaced(state.fleets.b));
  });

  it("places ships via random then ready", () => {
    let state = createBattleshipState(["a", "b"]);
    state = onBsAction(state, "a", { kind: "advance" });
    state = onBsAction(state, "a", { kind: "battleship_random" });
    assert.ok(allShipsPlaced(state.fleets.a));
    state = onBsAction(state, "a", { kind: "battleship_ready" });
    assert.equal(state.ready.a, true);
    assert.equal(state.phase, "placement");
  });

  it("auto-places only when timer expires", () => {
    let state = createBattleshipState(["a", "b"]);
    state = onBsAction(state, "a", { kind: "advance" });
    clearFleetPlacement(state.fleets.a);
    state.timerEndsAt = Date.now() - 1;
    state = onBsTick(state);
    assert.ok(allShipsPlaced(state.fleets.a));
    assert.ok(allShipsPlaced(state.fleets.b));
    assert.equal(state.phase, "battle");
  });
});

describe("battleship-logic placement helpers", () => {
  it("clearFleetPlacement resets ship cells", () => {
    const state = createBattleshipState(["a"]);
    autoPlaceFleet(state.fleets.a, state.gridSize);
    clearFleetPlacement(state.fleets.a);
    assert.ok(state.fleets.a.ships.every((s) => s.cells.length === 0));
  });
});
