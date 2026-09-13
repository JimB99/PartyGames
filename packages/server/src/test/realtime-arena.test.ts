import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_TRAIL_DASH_OPTIONS, TRAIL_DASH_PLAYING_GRACE_MS } from "@party-games/shared";
import {
  advanceCurve,
  createCurveGameState,
  onCurveAction,
  onCurveTick,
} from "../engines/realtime-arena.js";

describe("realtime-arena host pacing", () => {
  it("double advance from instructions does not end round during grace", () => {
    let state = createCurveGameState(
      ["p1", "p2", "p3"],
      [],
      {},
      DEFAULT_TRAIL_DASH_OPTIONS,
      { p1: 0, p2: 1, p3: 2 },
      true,
    );
    state = onCurveAction(state, "host", { kind: "advance" });
    assert.equal(state.phase, "playing");
    assert.ok(state.playingStartedAt != null);

    state = onCurveAction(state, "host", { kind: "advance" });
    assert.equal(state.phase, "playing");
  });

  it("allows host to end round after grace period", () => {
    let state = createCurveGameState(
      ["p1", "p2", "p3"],
      [],
      {},
      DEFAULT_TRAIL_DASH_OPTIONS,
      {},
      true,
    );
    state = onCurveAction(state, "host", { kind: "advance" });
    state.playingStartedAt = Date.now() - TRAIL_DASH_PLAYING_GRACE_MS - 10;
    state = onCurveAction(state, "host", { kind: "advance" });
    assert.equal(state.phase, "round_end");
  });

  it("simulates 3-player arena ticks without ending round immediately", () => {
    let state = createCurveGameState(
      ["p1", "p2", "p3"],
      [],
      {},
      DEFAULT_TRAIL_DASH_OPTIONS,
      { p1: 0, p2: 1, p3: 2 },
      false,
    );
    state = advanceCurve(state, ["p1", "p2", "p3"], []);
    assert.equal(state.phase, "playing");

    for (let i = 0; i < 120; i++) {
      state = onCurveTick(state, ["p1", "p2", "p3"], []);
      if (state.phase !== "playing") break;
    }
    assert.equal(state.phase, "playing");
    assert.equal(state.players.filter((p) => p.alive).length, 3);
  });

  it("bots steer after a second game start (steer throttle reset)", () => {
    const botIds = ["bot-1", "bot-2", "bot-3"];
    const botNames = { "bot-1": "B1", "bot-2": "B2", "bot-3": "B3" };
    const opts = { ...DEFAULT_TRAIL_DASH_OPTIONS, botCount: 3 };

    let state = createCurveGameState(["p1"], botIds, botNames, opts);
    state = advanceCurve(state, ["p1"], botIds);

    for (let i = 0; i < 500; i++) {
      state = onCurveTick(state, ["p1"], botIds);
      if (state.phase !== "playing") break;
    }

    state = createCurveGameState(["p1"], botIds, botNames, opts);
    state = advanceCurve(state, ["p1"], botIds);

    let steered = false;
    for (let i = 0; i < 40; i++) {
      state = onCurveTick(state, ["p1"], botIds);
      if (state.players.some((p) => p.isBot && p.alive && p.direction !== "none")) {
        steered = true;
        break;
      }
    }
    assert.equal(steered, true);
  });
});
