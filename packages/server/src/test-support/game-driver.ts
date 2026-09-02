import type { GameModule, RoomContext } from "@party-games/shared";
import { getSimulatorActions } from "../test/simulator-registry.js";
import {
  applyAction,
  expireTimers,
  getPhase,
  makePlayers,
  makeRoomContext,
  tickGame,
  type SimAction,
} from "./room-factory.js";

export interface RunUntilEndedOptions {
  maxSteps?: number;
  gameId: import("@party-games/shared").GameId;
}

export function runUntilEnded<TState>(
  game: GameModule<TState>,
  ctx: RoomContext,
  options: RunUntilEndedOptions,
): { state: TState; steps: number; ended: boolean } {
  const maxSteps = options.maxSteps ?? 2000;
  let state = game.init(ctx);
  const seen = new Set<string>();

  for (let step = 0; step < maxSteps; step++) {
    if (game.isGameOver(state)) {
      return { state, steps: step, ended: true };
    }

    const signature = `${getPhase(state)}:${JSON.stringify((state as { round?: number }).round ?? 0)}`;
    if (seen.has(signature) && step > 10) {
      expireTimers(state);
      if (game.needsTick?.(state) && game.onTick) {
        state = game.onTick(state);
      }
    }
    seen.add(signature);

    const actions = getSimulatorActions(options.gameId, state, ctx);
    for (const sim of actions) {
      state = applyAction(game, state, ctx, sim);
      if (game.isGameOver(state)) {
        return { state, steps: step + 1, ended: true };
      }
    }

    if (game.needsTick?.(state) && game.onTick) {
      const phase = getPhase(state);
      const shouldExpire =
        actions.length === 0 ||
        (options.gameId === "trail-dash" && phase === "playing") ||
        (options.gameId === "block-stack" && phase === "playing");
      if (shouldExpire) expireTimers(state);
      state = game.onTick(state);
    }
  }

  return { state, steps: maxSteps, ended: game.isGameOver(state) };
}

export function assertViews<TState>(game: GameModule<TState>, state: TState, ctx: RoomContext): void {
  const hostView = game.getHostView(state, ctx);
  if (!hostView.phase) throw new Error("Host view missing phase");
  for (const playerId of ctx.playerIds) {
    const playerView = game.getPlayerView(state, playerId, ctx);
    if (!playerView.phase) throw new Error(`Player view missing phase for ${playerId}`);
  }
}

export function assertScoresValid(scores: Record<string, number>): void {
  for (const [id, score] of Object.entries(scores)) {
    if (Number.isNaN(score)) throw new Error(`NaN score for ${id}`);
    if (score < 0) throw new Error(`Negative score for ${id}: ${score}`);
    if (!Number.isFinite(score)) throw new Error(`Non-finite score for ${id}`);
  }
}

export function assertNoSecretLeak(
  game: GameModule,
  state: unknown,
  ctx: RoomContext,
  secretKeys: string[],
): void {
  for (const playerId of ctx.playerIds) {
    const view = game.getPlayerView(state, playerId, ctx);
    const blob = JSON.stringify(view);
    for (const key of secretKeys) {
      if (blob.includes(key)) {
        throw new Error(`Secret leak "${key}" in player view for ${playerId}`);
      }
    }
  }
}

export { applyAction, expireTimers, getPhase, makePlayers, makeRoomContext, tickGame, type SimAction };
