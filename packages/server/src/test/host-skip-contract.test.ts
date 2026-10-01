import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS, type GameId, type GameOptions } from "@party-games/shared";
import { getGame } from "../registry.js";
import { applyHostSkip } from "../host-skip.js";
import { makeRoomContext } from "../test-support/room-factory.js";

const SKIP_CASES: Array<{ gameId: GameId; players: number; options?: Partial<GameOptions> }> = [
  { gameId: "trivia", players: 2 },
  { gameId: "bluff", players: 2 },
  { gameId: "prompt-vote", players: 3 },
  { gameId: "drawing", players: 3 },
  { gameId: "drawing", players: 3, options: { drawingStyle: "all-draw" } },
  { gameId: "impostor", players: 4 },
  { gameId: "block-stack", players: 2 },
];

describe("host skip contract", () => {
  for (const { gameId, players, options } of SKIP_CASES) {
    for (const hostPacing of [false, true]) {
      const label = options?.drawingStyle ? `${gameId}:${options.drawingStyle}` : gameId;
      it(`${label} skip to ended (hostPacing=${hostPacing})`, () => {
        const game = getGame(gameId)!;
        const ctx = makeRoomContext(players, { ...DEFAULT_GAME_OPTIONS, ...options, hostPacing });
        let state = game.init(ctx);
        for (let i = 0; i < 80; i++) {
          const before = game.getHostView(state, ctx).phase;
          if (before === "ended") break;
          state = applyHostSkip(game, state, ctx);
          const after = game.getHostView(state, ctx).phase;
          assert.notEqual(
            after,
            before,
            `${label} hostPacing=${hostPacing} skip did not change phase from ${before}`,
          );
        }
        assert.equal(game.getHostView(state, ctx).phase, "ended");
      });
    }
  }

  it("auto-timer skip leaves trivia question phase", () => {
    const game = getGame("trivia")!;
    const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, hostPacing: false });
    let state = game.init(ctx);
    state = applyHostSkip(game, state, ctx);
    assert.equal(game.getHostView(state, ctx).phase, "question");
    state = applyHostSkip(game, state, ctx);
    assert.equal(game.getHostView(state, ctx).phase, "reveal");
  });
});
