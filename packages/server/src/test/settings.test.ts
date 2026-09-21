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
  punchlineBattlePool,
  timelinePool,
  wouldYouRatherPool,
  impostorPool,
  crowdCallPool,
  spectrumPool,
  hangmanWordPool,
  agentGridWordPool,
  forbiddenCluePool,
  splitRoomPool,
} from "../content-pool.js";
import { getGame } from "../registry.js";
import { makeRoomContext, runUntilEnded } from "./harness.js";

const POOL_GETTERS: Partial<Record<string, (opts: GameOptions) => unknown[]>> = {
  bluff: (o) => [...factCheckPool(o), ...reverseFactPool(o)],
  "prompt-vote": (o) => [...punchlineBattlePool(o), ...hotSeatPool(o)],
  trivia: (o) => [...quizPool(o), ...timelinePool(o)],
  opinions: (o) => [...wouldYouRatherPool(o), ...splitRoomPool(o), ...crowdCallPool(o)],
  drawing: (o) => [...drawWordPool(o)],
  "bracket-battle": (o) => [...bracketCategoryPool(o)],
  "team-charades": (o) => [...charadesWordPool(o)],
  impostor: (o) => impostorPool(o).flatMap((p) => p.items),
  spectrum: spectrumPool,
  "hangman-race": (o) => [...hangmanWordPool(o)],
  "agent-grid": (o) => [...agentGridWordPool(o)],
  "forbidden-clue": forbiddenCluePool,
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

  it("trivia respects questionDisplay option", () => {
    const game = getGame("trivia")!;
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

  it("trivia timeline format uses custom timelinePtsPerYearOff", () => {
    const game = getGame("trivia")!;
    const ctx = makeRoomContext(2, {
      ...DEFAULT_GAME_OPTIONS,
      triviaFormat: "timeline",
      timelinePtsPerYearOff: 50,
    });
    assert.doesNotThrow(() => game.init(ctx));
  });

  it("bluff completes with speed scoring on and off", () => {
    const game = getGame("bluff")!;
    for (const speedScoring of ["off", "bonus"] as const) {
      const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, speedScoring });
      const { ended, state } = runUntilEnded(game, ctx, { gameId: "bluff", maxSteps: 2000 });
      assert.ok(ended, `bluff did not end with speedScoring=${speedScoring}`);
      assert.ok((state as { round?: number }).round && (state as { round: number }).round >= 2, "bluff should reach round 2+");
    }
  });

  it("bluff reverse-question mode inits", () => {
    const game = getGame("bluff")!;
    const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, bluffMode: "reverse-question" });
    const state = game.init(ctx) as { mode: string };
    assert.equal(state.mode, "reverse-question");
  });

  it("prompt-vote hot-seat mode inits", () => {
    const game = getGame("prompt-vote")!;
    const ctx = makeRoomContext(3, { ...DEFAULT_GAME_OPTIONS, promptVoteStyle: "hot-seat" });
    const state = game.init(ctx) as { mode: string };
    assert.equal(state.mode, "hot-seat");
  });

  it("opinions minority scoring inits", () => {
    const game = getGame("opinions")!;
    const ctx = makeRoomContext(3, { ...DEFAULT_GAME_OPTIONS, opinionScoring: "minority" });
    const state = game.init(ctx) as { scoring: string };
    assert.equal(state.scoring, "minority");
  });

  it("drawing telephone mode inits", () => {
    const game = getGame("drawing")!;
    const ctx = makeRoomContext(3, { ...DEFAULT_GAME_OPTIONS, drawingStyle: "telephone" });
    const state = game.init(ctx) as { style: string };
    assert.equal(state.style, "telephone");
  });

  it("impostor draw style inits", () => {
    const game = getGame("impostor")!;
    const ctx = makeRoomContext(4, { ...DEFAULT_GAME_OPTIONS, impostorStyle: "draw" });
    const state = game.init(ctx) as { style: string };
    assert.equal(state.style, "draw");
  });

  it("family and mature fact-check pools differ in size", () => {
    const family = factCheckPool({ ...DEFAULT_GAME_OPTIONS, contentRating: "family" });
    const mature = factCheckPool({ ...DEFAULT_GAME_OPTIONS, contentRating: "mature" });
    assert.ok(mature.length >= 50, `fact-check mature pool too small: ${mature.length}`);
    assert.ok(mature.every((row) => row.rating === "mature"));
    assert.ok(family.every((row) => (row.rating ?? "family") === "family"));
  });

  it("18+ impostor packs exclude family categories", () => {
    const family = impostorPool({ ...DEFAULT_GAME_OPTIONS, contentRating: "family" });
    const mature = impostorPool({ ...DEFAULT_GAME_OPTIONS, contentRating: "mature" });
    assert.ok(mature.length >= 2, `impostor mature packs too few: ${mature.length}`);
    assert.ok(mature.every((pack) => pack.rating === "mature"));
    assert.ok(family.every((pack) => (pack.rating ?? "family") === "family"));
    assert.ok(mature.flatMap((pack) => pack.items).length >= 50);
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
