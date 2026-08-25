import type { GameId } from "./constants.js";
import type { GameAction } from "./protocol.js";
import type { Player } from "./room.js";

export interface RoomContext {
  roomId: string;
  players: Player[];
  playerIds: string[];
}

export interface GameViewState {
  phase: string;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  data: Record<string, unknown>;
}

export interface GameModule<TState = unknown> {
  meta: {
    id: GameId;
    name: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
    category: "social" | "trivia" | "drawing" | "action";
  };
  init(ctx: RoomContext): TState;
  onPlayerAction(state: TState, playerId: string, action: GameAction, ctx: RoomContext): TState;
  onHostAction?(state: TState, action: GameAction, ctx: RoomContext): TState;
  onTick?(state: TState): TState;
  needsTick?(state: TState): boolean;
  tickIntervalMs?: number;
  getHostView(state: TState, ctx: RoomContext): GameViewState;
  getPlayerView(state: TState, playerId: string, ctx: RoomContext): GameViewState & {
    playerData: Record<string, unknown>;
  };
  getRoundScores(state: TState): Record<string, number>;
  isGameOver(state: TState): boolean;
}

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function uniqueId(): string {
  return Math.random().toString(36).slice(2, 10);
}
