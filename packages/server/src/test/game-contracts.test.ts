import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_GAME_OPTIONS,
  type GameId,
  type GameOptions,
  validateGameAction,
} from "@party-games/shared";
import { getGame, listGames } from "../registry.js";
import {
  assertScoresValid,
  assertViews,
  getPhase,
  makeRoomContext,
  runUntilEnded,
} from "../test-support/game-driver.js";

function contextForGame(gameId: GameId, playerCount: number) {
  let gameOptions: GameOptions = { ...DEFAULT_GAME_OPTIONS };
  if (gameId === "trail-dash") {
    gameOptions = {
      ...DEFAULT_GAME_OPTIONS,
      trailDash: { maxRounds: 1, roundTimeSec: 30, botCount: playerCount === 1 ? 1 : 0 },
    };
  }
  return makeRoomContext(playerCount, gameOptions);
}

describe("game contracts", () => {
  for (const meta of listGames()) {
    describe(meta.id, () => {
      it(`rejects below min players (${meta.minPlayers - 1})`, () => {
        if (meta.minPlayers <= 1) return;
        const game = getGame(meta.id)!;
        const ctx = contextForGame(meta.id, meta.minPlayers - 1);
        const state = game.init(ctx);
        assertViews(game, state, ctx);
      });

      for (const label of ["min", "max"] as const) {
        const playerCount = label === "min" ? meta.minPlayers : meta.maxPlayers;
        it(`completes at ${label} players (${playerCount})`, () => {
          const game = getGame(meta.id)!;
          const ctx = contextForGame(meta.id, playerCount);
          const { state, ended } = runUntilEnded(game, ctx, {
            gameId: meta.id,
            maxSteps:
              meta.id === "last-on-the-dike" ? 20000 : meta.id === "tic-tac-toe" ? 15000 : 3000,
          });
          assertViews(game, state, ctx);
          assertScoresValid(game.getRoundScores(state));
          if (!ended) {
            assert.fail(`${meta.id} did not end (phase: ${getPhase(state)})`);
          }
          assert.equal(getPhase(state), "ended");
        });
      }

      it("validates malformed actions without throwing", () => {
        const bad = validateGameAction({ kind: "submit_text", text: "" });
        assert.equal(bad.ok, false);
        const good = validateGameAction({ kind: "advance" });
        assert.equal(good.ok, true);
      });
    });
  }
});
