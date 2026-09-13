import type { GameModule, GameId } from "@party-games/shared";
import { applyAction, getPhase, makeRoomContext, runUntilEnded, type SimAction } from "./game-driver.js";

export function assertScoresValid(scores: Record<string, number>): void {
  for (const [id, score] of Object.entries(scores)) {
    if (Number.isNaN(score)) throw new Error(`NaN score for ${id}`);
    if (score < 0) throw new Error(`Negative score for ${id}: ${score}`);
    if (!Number.isFinite(score)) throw new Error(`Non-finite score for ${id}`);
  }
}

/** At least one player has points > 0 (games that award scores). */
export function assertSomeoneScored(scores: Record<string, number>, minTotal = 1): void {
  assertScoresValid(scores);
  const total = Object.values(scores).reduce((sum, pts) => sum + pts, 0);
  if (total < minTotal) {
    throw new Error(`Expected total score >= ${minTotal}, got ${total}`);
  }
}

export function sumScores(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, pts) => sum + pts, 0);
}

export function runScriptedGame<TState>(
  game: GameModule<TState>,
  ctx: ReturnType<typeof makeRoomContext>,
  script: SimAction[],
): TState {
  let state = game.init(ctx);
  for (const sim of script) {
    state = applyAction(game, state, ctx, sim);
  }
  return state;
}

export function runGameToEnd(
  game: GameModule,
  ctx: ReturnType<typeof makeRoomContext>,
  gameId: GameId,
  maxSteps = 3000,
) {
  return runUntilEnded(game, ctx, { gameId, maxSteps });
}

export { getPhase };
