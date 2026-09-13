import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCurveState,
  markPlayingStarted,
  shouldIgnoreHostEndRound,
  tickCurveState,
  TRAIL_DASH_PLAYING_GRACE_MS,
} from "./trail-dash-logic.js";
import { DEFAULT_TRAIL_DASH_OPTIONS } from "./trail-dash-options.js";
import { validateClientMessage } from "./protocol-schema.js";

const SPAWN_MARGIN = 120;

function simulateTicks(state: ReturnType<typeof createCurveState>, ticks: number) {
  for (let i = 0; i < ticks; i++) {
    tickCurveState(state);
    if (state.phase !== "playing") break;
  }
}

describe("trail-dash simulation", () => {
  it("keeps 3 humans in playing through 150 ticks with no steering", () => {
    const state = createCurveState(
      ["p1", "p2", "p3"],
      [],
      {},
      DEFAULT_TRAIL_DASH_OPTIONS,
      1,
      { p1: 0, p2: 1, p3: 2 },
    );
    markPlayingStarted(state, Date.now());
    simulateTicks(state, 150);
    assert.equal(state.phase, "playing");
    const alive = state.players.filter((p) => p.alive);
    assert.equal(alive.length, 3);
  });

  it("keeps 3 humans + 2 bots in playing through 100 ticks", () => {
    const state = createCurveState(
      ["p1", "p2", "p3"],
      ["bot-1", "bot-2"],
      { "bot-1": "Bot 1", "bot-2": "Bot 2" },
      { ...DEFAULT_TRAIL_DASH_OPTIONS, botCount: 2, powerUpMode: "normal" },
      1,
      { p1: 0, p2: 1, p3: 2 },
    );
    markPlayingStarted(state, Date.now());
    simulateTicks(state, 100);
    assert.equal(state.phase, "playing");
    assert.ok(state.players.filter((p) => p.alive).length >= 2);
  });

  it("uses distinct spawn slots when lobby color index would overlap bot slot", () => {
    const state = createCurveState(
      ["human"],
      ["bot-b"],
      { "bot-b": "Bot" },
      DEFAULT_TRAIL_DASH_OPTIONS,
      1,
      { human: 5 },
    );
    const human = state.players.find((p) => p.id === "human")!;
    const bot = state.players.find((p) => p.id === "bot-b")!;
    assert.equal(human.colorIndex, 5);
    assert.equal(human.x, SPAWN_MARGIN);
    assert.equal(bot.x, 1200 - SPAWN_MARGIN);
    assert.notEqual(human.x, bot.x);
  });

  it("host grace blocks end-round inside grace window", () => {
    const state = createCurveState(
      ["a", "b", "c"],
      [],
      {},
      DEFAULT_TRAIL_DASH_OPTIONS,
      1,
      {},
      true,
    );
    markPlayingStarted(state, 10_000);
    assert.equal(shouldIgnoreHostEndRound(state, 10_000), true);
    assert.equal(shouldIgnoreHostEndRound(state, 10_000 + TRAIL_DASH_PLAYING_GRACE_MS - 1), true);
    assert.equal(shouldIgnoreHostEndRound(state, 10_000 + TRAIL_DASH_PLAYING_GRACE_MS), false);
  });

  it("respects host-paced mode with power-ups off across ticks", () => {
    const state = createCurveState(
      ["a", "b"],
      [],
      {},
      { ...DEFAULT_TRAIL_DASH_OPTIONS, powerUpMode: "off" },
      1,
      {},
      true,
    );
    markPlayingStarted(state, Date.now());
    simulateTicks(state, 80);
    assert.equal(state.phase, "playing");
    assert.equal(state.powerUps.length, 0);
  });

  it("survives 200 ticks with alternating turn inputs from 3 players", () => {
    const state = createCurveState(
      ["p1", "p2", "p3"],
      [],
      {},
      DEFAULT_TRAIL_DASH_OPTIONS,
      1,
      { p1: 0, p2: 1, p3: 2 },
    );
    markPlayingStarted(state, Date.now());
    const turns: Array<"left" | "right" | "none"> = ["left", "right", "none"];
    for (let i = 0; i < 200; i++) {
      for (let p = 0; p < state.players.length; p++) {
        state.players[p].direction = turns[(i + p) % turns.length];
      }
      tickCurveState(state);
      if (state.phase !== "playing") break;
    }
    assert.equal(state.phase, "playing");
    assert.ok(state.players.filter((p) => p.alive).length >= 2);
  });

  it("round timer mode does not end round in first 30 ticks with 3 players", () => {
    const state = createCurveState(
      ["a", "b", "c"],
      [],
      {},
      { ...DEFAULT_TRAIL_DASH_OPTIONS, roundTimeSec: 90 },
      1,
      {},
      false,
    );
    markPlayingStarted(state, Date.now());
    simulateTicks(state, 30);
    assert.equal(state.phase, "playing");
  });
});

describe("trail-dash protocol options", () => {
  it("preserves full trailDash settings through set_game_options", () => {
    const result = validateClientMessage({
      type: "set_game_options",
      gameId: "trail-dash",
      options: {
        contentRating: "family",
        difficulty: "mixed",
        hostPacing: true,
        trailDash: {
          roundTimeSec: 45,
          maxRounds: 2,
          botCount: 3,
          botDifficulty: "hard",
          coinValue: 75,
          powerUpMode: "chaos",
          wallHoles: 1,
        },
      },
    });
    assert.equal(result.ok, true);
    if (result.ok && result.value.type === "set_game_options") {
      const td = result.value.options.trailDash!;
      assert.equal(td.roundTimeSec, 45);
      assert.equal(td.maxRounds, 2);
      assert.equal(td.botCount, 3);
      assert.equal(td.botDifficulty, "hard");
      assert.equal(td.coinValue, 75);
      assert.equal(td.powerUpMode, "chaos");
      assert.equal(td.wallHoles, 1);
      assert.equal(result.value.options.hostPacing, true);
    }
  });
});
