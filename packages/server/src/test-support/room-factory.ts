import {
  DEFAULT_GAME_OPTIONS,
  PLAYER_COLORS,
  type GameAction,
  type GameOptions,
  type RoomContext,
} from "@party-games/shared";

export function makePlayers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    nickname: `Player ${i + 1}`,
    colorIndex: i % PLAYER_COLORS.length,
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

export type SimAction = {
  role: "host" | "player";
  playerId?: string;
  action: GameAction;
};

export function expireTimers(state: unknown, now = Date.now()): void {
  if (!state || typeof state !== "object") return;
  const s = state as Record<string, unknown>;
  if (typeof s.timerEndsAt === "number") {
    s.timerEndsAt = now - 1;
  }
}

export function getPhase(state: unknown): string {
  if (!state || typeof state !== "object") return "";
  return String((state as { phase?: string }).phase ?? "");
}

export function applyAction<TState>(
  game: import("@party-games/shared").GameModule<TState>,
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

export function tickGame<TState>(
  game: import("@party-games/shared").GameModule<TState>,
  state: TState,
  now = Date.now(),
): TState {
  if (!game.needsTick?.(state) || !game.onTick) return state;
  expireTimers(state, now);
  return game.onTick(state);
}