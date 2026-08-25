import type { GameId } from "./constants.js";

export type ConnectionRole = "host" | "player";

export interface Player {
  id: string;
  nickname: string;
  colorIndex: number;
  connected: boolean;
}

export type RoomPhase = "lobby" | "playing" | "ended";

export interface RoomState {
  roomId: string;
  phase: RoomPhase;
  players: Player[];
  hostConnectionId: string | null;
  selectedGameId: GameId | null;
  activeGameId: GameId | null;
  sessionScores: Record<string, number>;
  gameState: unknown | null;
  gameView: import("./game.js").GameViewState | null;
}
