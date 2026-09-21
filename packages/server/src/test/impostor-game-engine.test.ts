import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS } from "@party-games/shared";
import {
  createImpostorGameState,
  impostorGameHostView,
} from "../engines/impostor-game-engine.js";

const playerIds = ["p1", "p2", "p3", "p4"];
const verbalPool = [
  { id: "places", label: "Places", items: ["Paris", "Tokyo"] },
];
const drawLocations = [{ name: "Beach", category: "places" }];

describe("impostor-game-engine", () => {
  it("verbal style inits impostor state", () => {
    const state = createImpostorGameState("verbal", verbalPool, drawLocations, playerIds, DEFAULT_GAME_OPTIONS);
    assert.equal(state.style, "verbal");
    assert.equal(state.inner.phase, "instructions");
  });

  it("draw style inits draw impostor state", () => {
    const state = createImpostorGameState("draw", verbalPool, drawLocations, playerIds, {
      ...DEFAULT_GAME_OPTIONS,
      impostorStyle: "draw",
    });
    assert.equal(state.style, "draw");
    assert.equal(state.inner.phase, "instructions");
  });

  it("host view includes impostorStyle", () => {
    const state = createImpostorGameState("verbal", verbalPool, drawLocations, playerIds);
    const view = impostorGameHostView(state);
    assert.equal(view.data.impostorStyle, "verbal");
  });
});
