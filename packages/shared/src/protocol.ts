import type { GameId } from "./constants.js";
import type { GameMeta } from "./constants.js";
import type { GameOptions } from "./content.js";
import type { ConnectionRole } from "./room.js";

export type ClientMessage =
  | { type: "join"; role: ConnectionRole; nickname?: string; playerId?: string; colorIndex?: number }
  | { type: "select_game"; gameId: GameId }
  | { type: "start_game" }
  | { type: "set_game_options"; gameId: GameId; options: GameOptions }
  | { type: "set_session_playlist"; gameIds: GameId[] }
  | { type: "start_session" }
  | { type: "next_session_game" }
  | { type: "clear_session_playlist" }
  | { type: "play_again" }
  | { type: "return_to_lobby" }
  | { type: "pause_game" }
  | { type: "resume_game" }
  | { type: "extend_timer"; extraMs: number }
  | { type: "player_action"; action: GameAction }
  | { type: "host_action"; action: GameAction }
  | { type: "ping" }
  | { type: "check_room" }
  | { type: "update_profile"; nickname?: string; colorIndex?: number };

export type GameAction =
  | { kind: "submit_text"; text: string }
  | { kind: "vote"; optionId: string }
  | { kind: "vote_pair"; winnerId: string }
  | { kind: "trivia_answer"; choiceIndex: number }
  | { kind: "year_slider"; year: number }
  | { kind: "would_you_rather"; choice: "a" | "b" }
  | { kind: "draw_stroke"; points: number[]; color: string; width?: number }
  | { kind: "draw_undo" }
  | { kind: "draw_clear" }
  | { kind: "draw_tool"; tool: "pen" | "eraser"; width?: number }
  | { kind: "assign_role"; assignments: Record<string, string> }
  | { kind: "impostor_task"; result: "success" | "fail" }
  | { kind: "impostor_eject"; targetId: string }
  | { kind: "trail_dash_turn"; direction: "left" | "right" | "none" }
  | { kind: "trail_dash_jump" }
  | { kind: "trail_dash_fire" }
  | { kind: "charades_correct" }
  | { kind: "charades_skip" }
  | { kind: "hot_seat_pick"; submissionId: string }
  | { kind: "advance" }
  | { kind: "dike_bid"; amount: number }
  | { kind: "block_stack_input"; input: "left" | "right" | "rotate_cw" | "rotate_ccw" | "soft_drop" | "hard_drop" | "hold" }
  | { kind: "spectrum_guess"; value: number }
  | { kind: "split_vote"; side: "a" | "b" }
  | { kind: "crowd_predict"; choiceIndex: number }
  | { kind: "crowd_answer"; choiceIndex: number }
  | { kind: "star_rate"; submissionId: string; stars: number }
  | { kind: "fleet_duel_place"; shipIndex: number; x: number; y: number; horizontal: boolean }
  | { kind: "fleet_duel_random" }
  | { kind: "fleet_duel_ready" }
  | { kind: "fleet_duel_fire"; x: number; y: number; targetId?: string }
  | { kind: "fleet_duel_bet"; market: "next_elimination" | "most_hits"; pick: string; amount: number }
  | { kind: "four_in_a_row_drop"; column: number }
  | { kind: "tic_tac_toe_move"; cell: number }
  | { kind: "stranger_accuse"; targetId: string }
  | { kind: "stranger_guess"; itemIndex: number }
  | { kind: "agent_clue"; word: string; count: number }
  | { kind: "agent_guess"; index: number }
  | { kind: "agent_pass" }
  | { kind: "forbidden_correct" }
  | { kind: "forbidden_skip" }
  | { kind: "forbidden_foul" }
  | { kind: "hangman_letter"; letter: string }
  | { kind: "paddle_move"; y: number }
  | { kind: "grid_blast_input"; input: "up" | "down" | "left" | "right" | "bomb" };

export type ServerMessage =
  | { type: "room_state"; state: RoomSnapshot }
  | { type: "player_view"; view: PlayerViewSnapshot }
  | { type: "error"; message: string }
  | { type: "pong" }
  | { type: "room_available" };

export interface RoomSnapshot {
  roomId: string;
  phase: "lobby" | "playing" | "ended";
  paused: boolean;
  players: Array<{
    id: string;
    nickname: string;
    colorIndex: number;
    connected: boolean;
  }>;
  selectedGameId: GameId | null;
  activeGameId: GameId | null;
  sessionScores: Record<string, number>;
  gameScores: Record<string, number>;
  gameOptionsByGame: Partial<Record<GameId, GameOptions>>;
  activeGameOptions: GameOptions | null;
  hostView: HostViewSnapshot | null;
  role: ConnectionRole;
  playerId: string | null;
  games: GameMeta[];
  sessionPlaylist: GameId[];
  sessionPlaylistIndex: number;
  sessionActive: boolean;
}

export interface HostViewSnapshot {
  gameId: GameId;
  phase: string;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs?: number | null;
  data: Record<string, unknown>;
}

export interface PlayerViewSnapshot {
  gameId: GameId;
  phase: string;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs?: number | null;
  data: Record<string, unknown>;
  playerData: Record<string, unknown>;
}
