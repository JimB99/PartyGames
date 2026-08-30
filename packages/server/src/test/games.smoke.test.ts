import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_GAME_OPTIONS,
  type GameId,
  type GameOptions,
} from "@party-games/shared";
import { getGame, listGames } from "../registry.js";
import {
  applyAction,
  assertScoresValid,
  assertViews,
  getPhase,
  makeRoomContext,
  runUntilEnded,
} from "./harness.js";

function contextForGame(gameId: GameId, playerCount: number): ReturnType<typeof makeRoomContext> {
  let gameOptions: GameOptions = { ...DEFAULT_GAME_OPTIONS };

  if (gameId === "trail-dash") {
    gameOptions = {
      ...DEFAULT_GAME_OPTIONS,
      trailDash: {
        maxRounds: 1,
        roundTimeSec: 30,
        botCount: playerCount === 1 ? 1 : 0,
      },
    };
  }

  return makeRoomContext(playerCount, gameOptions);
}

describe("game smoke tests", () => {
  for (const meta of listGames()) {
    for (const label of ["min", "max"] as const) {
      const playerCount = label === "min" ? meta.minPlayers : meta.maxPlayers;

      it(`${meta.id} @ ${label} players (${playerCount})`, () => {
        const game = getGame(meta.id);
        assert.ok(game, `missing game module for ${meta.id}`);

        const ctx = contextForGame(meta.id, playerCount);
        const { state, ended, steps } = runUntilEnded(game!, ctx, {
          gameId: meta.id,
          maxSteps:
            meta.id === "last-on-the-dike"
              ? 20000
              : meta.id === "tic-tac-toe"
                ? 15000
                : 3000,
        });

        assertViews(game!, state, ctx);
        assertScoresValid(game!.getRoundScores(state));

        if (!ended) {
          assert.fail(`${meta.id} @ ${playerCount} players did not end within ${steps} steps (phase: ${getPhase(state)})`);
        }

        assert.equal(getPhase(state), "ended");

        if (meta.id === "fact-check" || meta.id === "wit-showdown") {
          const round = (state as { round?: number }).round ?? 0;
          assert.ok(round >= 2, `${meta.id} should play multiple rounds (got round ${round})`);
        }
      });
    }
  }

  it("quick-quiz advances past instructions after host advance", () => {
    const game = getGame("quick-quiz")!;
    const ctx = makeRoomContext(2);
    let state = game.init(ctx);
    state = applyAction(game, state, ctx, { role: "host", action: { kind: "advance" } });
    assert.notEqual(getPhase(state), "instructions");
  });
});
