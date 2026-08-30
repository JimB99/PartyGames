import {
  DEFAULT_GAME_OPTIONS,
  type GameAction,
  type GameId,
  type GameModule,
  type GameOptions,
  type RoomContext,
} from "@party-games/shared";
import { getSimulatorActions } from "./simulator-registry.js";

export function makePlayers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    nickname: `Player ${i + 1}`,
    colorIndex: i % 8,
    connected: true,
  }));
}

export function makeRoomContext(
  playerCount: number,
  gameOptions: GameOptions = DEFAULT_GAME_OPTIONS,
  roomId = "TEST",
): RoomContext {
  const players = makePlayers(playerCount);
  return {
    roomId,
    players,
    playerIds: players.map((p) => p.id),
    gameOptions,
  };
}

export function expireTimers(state: unknown): void {
  if (!state || typeof state !== "object") return;
  const s = state as Record<string, unknown>;
  if (typeof s.timerEndsAt === "number") {
    s.timerEndsAt = Date.now() - 1;
  }
}

export function getPhase(state: unknown): string {
  if (!state || typeof state !== "object") return "";
  return String((state as { phase?: string }).phase ?? "");
}

export type SimAction = {
  role: "host" | "player";
  playerId?: string;
  action: GameAction;
};

export function applyAction<TState>(
  game: GameModule<TState>,
  state: TState,
  ctx: RoomContext,
  sim: SimAction,
): TState {
  if (sim.role === "host" && game.onHostAction) {
    return game.onHostAction(state, sim.action, ctx);
  }
  if (sim.role === "player" && sim.playerId) {
    return game.onPlayerAction(state, sim.playerId, sim.action, ctx);
  }
  return state;
}

export function tickGame<TState>(game: GameModule<TState>, state: TState): TState {
  if (!game.needsTick?.(state) || !game.onTick) return state;
  expireTimers(state);
  return game.onTick(state);
}

export interface RunUntilEndedOptions {
  maxSteps?: number;
  gameId: GameId;
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
  }
}
