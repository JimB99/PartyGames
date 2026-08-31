import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_GAME_OPTIONS,
  resolveQuestionDisplay,
  type GameOptions,
} from "@party-games/shared";
import { listGames } from "../registry.js";
import {
  bracketCategoryPool,
  charadesWordPool,
  drawWordPool,
  factCheckPool,
  reverseFactPool,
  hotSeatPool,
  quizPool,
  witShowdownPool,
  timelinePool,
  wouldYouRatherPool,
} from "../content-pool.js";
import { getGame } from "../registry.js";
import { makeRoomContext, runUntilEnded } from "./harness.js";

const POOL_GETTERS: Partial<Record<string, (opts: GameOptions) => unknown[]>> = {
  "fact-check": factCheckPool,
  "reverse-fact": reverseFactPool,
  "wit-showdown": witShowdownPool,
  "quick-quiz": quizPool,
  "would-you-rather": wouldYouRatherPool,
  "draw-guess": (o) => [...drawWordPool(o)],
  "bracket-battle": (o) => [...bracketCategoryPool(o)],
  timeline: timelinePool,
  "team-charades": (o) => [...charadesWordPool(o)],
  "hot-seat": hotSeatPool,
};

describe("settings matrix", () => {
  for (const meta of listGames()) {
    if (meta.supportsMatureContent) {
      it(`${meta.id} init with family and mature content`, () => {
        const game = getGame(meta.id)!;
        for (const contentRating of ["family", "mature"] as const) {
          const ctx = makeRoomContext(Math.max(meta.minPlayers, 2), {
            ...DEFAULT_GAME_OPTIONS,
            contentRating,
          });
          assert.doesNotThrow(() => game.init(ctx));
          const poolFn = POOL_GETTERS[meta.id];
          if (poolFn) {
            const pool = poolFn({ ...DEFAULT_GAME_OPTIONS, contentRating });
            assert.ok(pool.length >= 10, `${meta.id} pool empty for ${contentRating}`);
          }
        }
      });
    }

    if (meta.supportsDifficulty) {
      it(`${meta.id} init with each difficulty`, () => {
        const game = getGame(meta.id)!;
        for (const difficulty of ["easy", "medium", "hard", "mixed"] as const) {
          const ctx = makeRoomContext(Math.max(meta.minPlayers, 2), {
            ...DEFAULT_GAME_OPTIONS,
            difficulty,
          });
          assert.doesNotThrow(() => game.init(ctx));
        }
      });
    }
  }

  it("quick-quiz respects questionDisplay option", () => {
    const game = getGame("quick-quiz")!;
    const ctx = makeRoomContext(2, {
      ...DEFAULT_GAME_OPTIONS,
      questionDisplay: "tv_full",
    });
    let state = game.init(ctx);
    state = game.onHostAction!(state, { kind: "advance" }, ctx);
    const view = game.getHostView(state, ctx);
    assert.equal(resolveQuestionDisplay(ctx.gameOptions), "tv_full");
    assert.ok(view.data);
  });

  it("timeline uses custom timelinePtsPerYearOff", () => {
    const game = getGame("timeline")!;
    const ctx = makeRoomContext(2, {
      ...DEFAULT_GAME_OPTIONS,
      timelinePtsPerYearOff: 50,
    });
    assert.doesNotThrow(() => game.init(ctx));
  });

  it("fact-check completes with speed scoring on and off", () => {
    const game = getGame("fact-check")!;
    for (const speedScoring of ["off", "bonus"] as const) {
      const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, speedScoring });
      const { ended, state } = runUntilEnded(game, ctx, { gameId: "fact-check", maxSteps: 2000 });
      assert.ok(ended, `fact-check did not end with speedScoring=${speedScoring}`);
      assert.ok((state as { round?: number }).round && (state as { round: number }).round >= 2, "fact-check should reach round 2+");
    }
  });

  it("family and mature fact-check pools differ in size", () => {
    const family = factCheckPool({ ...DEFAULT_GAME_OPTIONS, contentRating: "family" });
    const mature = factCheckPool({ ...DEFAULT_GAME_OPTIONS, contentRating: "mature" });
    assert.ok(mature.length > family.length);
  });

  it("trail-dash min: 1 human + 1 bot initializes", () => {
    const game = getGame("trail-dash")!;
    const ctx = makeRoomContext(1, {
      ...DEFAULT_GAME_OPTIONS,
      trailDash: { botCount: 1, maxRounds: 1, roundTimeSec: 30 },
    });
    const state = game.init(ctx);
    assert.equal((state as { players: unknown[] }).players.length, 2);
  });

  it("trail-dash with 0 bots and 1 human still inits (start guard is in room)", () => {
    const game = getGame("trail-dash")!;
    const ctx = makeRoomContext(1, {
      ...DEFAULT_GAME_OPTIONS,
      trailDash: { botCount: 0, maxRounds: 1, roundTimeSec: 30 },
    });
    assert.doesNotThrow(() => game.init(ctx));
  });

  it("paddle-clash inits with pong and hockey modes", () => {
    const game = getGame("paddle-clash")!;
    for (const paddleMode of ["pong", "hockey"] as const) {
      const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, paddleMode });
      assert.doesNotThrow(() => game.init(ctx));
    }
  });

  it("impostor inits with each category", () => {
    const game = getGame("impostor")!;
    for (const impostorCategory of ["all", "places", "things", "jobs", "random"] as const) {
      const ctx = makeRoomContext(4, { ...DEFAULT_GAME_OPTIONS, impostorCategory });
      assert.doesNotThrow(() => game.init(ctx));
    }
  });

  it("hangman-race completes with speed scoring on and off", () => {
    const game = getGame("hangman-race")!;
    for (const speedScoring of ["off", "bonus"] as const) {
      const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, speedScoring });
      const { ended } = runUntilEnded(game, ctx, { gameId: "hangman-race", maxSteps: 3000 });
      assert.ok(ended, `hangman-race did not end with speedScoring=${speedScoring}`);
    }
  });
});
