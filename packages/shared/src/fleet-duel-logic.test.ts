import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  autoPlaceFleet,
  createFleetDuelState,
  fireAt,
  fleetDestroyed,
  placeShip,
  resolveRoyaleRound,
} from "./fleet-duel-logic.js";

describe("fleet-duel-logic", () => {
  it("places and sinks ships", () => {
    const state = createFleetDuelState(["a", "b"]);
    const fleet = state.fleets.a;
    assert.ok(placeShip(fleet, 10, 0, 0, 0, true));
    const cell = fleet.ships[0].cells[0];
    const result = fireAt(fleet, cell.x, cell.y);
    assert.equal(result.hit, true);
  });

  it("auto places full fleet", () => {
    const state = createFleetDuelState(["a", "b", "c"]);
    autoPlaceFleet(state.fleets.a, state.gridSize);
    assert.ok(state.fleets.a.ships.every((s) => s.cells.length === s.length));
  });

  it("resolves royale round", () => {
    const state = createFleetDuelState(["a", "b", "c"]);
    autoPlaceFleet(state.fleets.a, state.gridSize);
    autoPlaceFleet(state.fleets.b, state.gridSize);
    const ship = state.fleets.b.ships[0];
    const shot = { fromId: "a", targetId: "b", x: ship.cells[0].x, y: ship.cells[0].y };
    const results = resolveRoyaleRound(state, [shot]);
    assert.equal(results[0].hit, true);
  });
});
