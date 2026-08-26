import type { GameId } from "./constants.js";
import type { GameMeta } from "./constants.js";
import type { GameOptions } from "./content.js";
import type { ConnectionRole } from "./room.js";

export type ClientMessage =
  | { type: "join"; role: ConnectionRole; nickname?: string; playerId?: string }
  | { type: "select_game"; gameId: GameId }
  | { type: "set_game_options"; gameId: GameId; options: GameOptions }
  | { type: "start_game" }
  | { type: "return_to_lobby" }
  | { type: "player_action"; action: GameAction }
  | { type: "host_action"; action: GameAction }
  | { type: "ping" };

export type GameAction =
  | { kind: "submit_text"; text: string }
  | { kind: "vote"; optionId: string }
  | { kind: "vote_pair"; winnerId: string }
  | { kind: "trivia_answer"; choiceIndex: number }
  | { kind: "year_slider"; year: number }
  | { kind: "would_you_rather"; choice: "a" | "b" }
  | { kind: "draw_stroke"; points: number[]; color: string }
  | { kind: "draw_clear" }
  | { kind: "assign_role"; assignments: Record<string, string> }
  | { kind: "impostor_task"; result: "success" | "fail" }
  | { kind: "impostor_eject"; targetId: string }
  | { kind: "curve_turn"; direction: "left" | "right" | "none" }
  | { kind: "charades_correct" }
  | { kind: "charades_skip" }
  | { kind: "hot_seat_pick"; submissionId: string }
  | { kind: "advance" }
  | { kind: "dike_bid"; amount: number };

export type ServerMessage =
  | { type: "room_state"; state: RoomSnapshot }
  | { type: "player_view"; view: PlayerViewSnapshot }
  | { type: "error"; message: string }
  | { type: "pong" };

export interface RoomSnapshot {
  roomId: string;
  phase: "lobby" | "playing" | "ended";
  players: Array<{
    id: string;
    nickname: string;
    colorIndex: number;
    connected: boolean;
  }>;
  selectedGameId: GameId | null;
  activeGameId: GameId | null;
  sessionScores: Record<string, number>;
  gameOptionsByGame: Partial<Record<GameId, GameOptions>>;
  activeGameOptions: GameOptions | null;
  hostView: HostViewSnapshot | null;
  role: ConnectionRole;
  playerId: string | null;
  games: GameMeta[];
}

export interface HostViewSnapshot {
  gameId: GameId;
  phase: string;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  data: Record<string, unknown>;
}

export interface PlayerViewSnapshot {
  gameId: GameId;
  phase: string;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  data: Record<string, unknown>;
  playerData: Record<string, unknown>;
}
