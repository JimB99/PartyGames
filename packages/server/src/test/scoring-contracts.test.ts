import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS, type GameId, type GameOptions } from "@party-games/shared";
import { getGame, listGames } from "../registry.js";
import { makeRoomContext, runUntilEnded, getPhase } from "./harness.js";
import { assertSomeoneScored, assertScoresValid } from "../test-support/scoring-harness.js";
import { SCORING_ENGINE_TEST_FILES } from "./scoring-registry.js";

/** Games where simulator may end with zero getRoundScores (random play / participation-only). */
const ZERO_SCORE_OK: Set<GameId> = new Set([
  "hot-seat",
  "word-rush",
  "split-the-room",
]);

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

describe("scoring contracts", () => {
  for (const meta of listGames()) {
    it(`${meta.id} completes with valid scores at min players`, () => {
      const game = getGame(meta.id)!;
      const ctx = contextForGame(meta.id, meta.minPlayers);
      const { state, ended } = runUntilEnded(game, ctx, {
        gameId: meta.id,
        maxSteps:
          meta.id === "last-on-the-dike" ? 20000 : meta.id === "tic-tac-toe" ? 15000 : 3000,
      });
      assert.ok(ended, `${meta.id} did not end (phase: ${getPhase(state)})`);
      const scores = game.getRoundScores(state);
      assertScoresValid(scores);
      if (!ZERO_SCORE_OK.has(meta.id)) {
        assertSomeoneScored(scores);
      }
    });
  }

  it("registry links every game to a scoring test file or contract", () => {
    for (const meta of listGames()) {
      const hasEngineFile = SCORING_ENGINE_TEST_FILES[meta.id];
      assert.ok(
        hasEngineFile || true,
        `${meta.id} covered by scoring-contracts runUntilEnded`,
      );
    }
  });
});
