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
  captionPool,
  charadesWordPool,
  drawWordPool,
  fibbagePool,
  fibbageReversePool,
  hotSeatPool,
  quizPool,
  quiplashPool,
  timelinePool,
  wouldYouRatherPool,
} from "../content-pool.js";
import { getGame } from "../registry.js";
import { makeRoomContext, runUntilEnded } from "./harness.js";

const POOL_GETTERS: Partial<Record<string, (opts: GameOptions) => unknown[]>> = {
  fibbage: fibbagePool,
  "fibbage-reverse": fibbageReversePool,
  quiplash: quiplashPool,
  "quick-quiz": quizPool,
  "would-you-rather": wouldYouRatherPool,
  "caption-this": captionPool,
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

  it("fibbage completes with speed scoring on and off", () => {
    const game = getGame("fibbage")!;
    for (const speedScoring of ["off", "bonus"] as const) {
      const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, speedScoring });
      const { ended, state } = runUntilEnded(game, ctx, { gameId: "fibbage", maxSteps: 2000 });
      assert.ok(ended, `fibbage did not end with speedScoring=${speedScoring}`);
      assert.ok((state as { round?: number }).round && (state as { round: number }).round >= 2, "fibbage should reach round 2+");
    }
  });

  it("family and mature fibbage pools differ in size", () => {
    const family = fibbagePool({ ...DEFAULT_GAME_OPTIONS, contentRating: "family" });
    const mature = fibbagePool({ ...DEFAULT_GAME_OPTIONS, contentRating: "mature" });
    assert.ok(mature.length > family.length);
  });

  it("curve-fever min: 1 human + 1 bot initializes", () => {
    const game = getGame("curve-fever")!;
    const ctx = makeRoomContext(1, {
      ...DEFAULT_GAME_OPTIONS,
      trailDash: { botCount: 1, maxRounds: 1, roundTimeSec: 30 },
    });
    const state = game.init(ctx);
    assert.equal((state as { players: unknown[] }).players.length, 2);
  });

  it("curve-fever with 0 bots and 1 human still inits (start guard is in room)", () => {
    const game = getGame("curve-fever")!;
    const ctx = makeRoomContext(1, {
      ...DEFAULT_GAME_OPTIONS,
      trailDash: { botCount: 0, maxRounds: 1, roundTimeSec: 30 },
    });
    assert.doesNotThrow(() => game.init(ctx));
  });
});
