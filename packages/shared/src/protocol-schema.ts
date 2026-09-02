import type { ClientMessage, GameAction } from "./protocol.js";
import { ALL_GAME_IDS, type GameId } from "./constants.js";
import { DEFAULT_GAME_OPTIONS, type GameOptions } from "./content.js";

const MAX_MESSAGE_BYTES = 16 * 1024;
const MAX_NICKNAME_LEN = 24;
const MAX_TEXT_LEN = 160;
const MAX_DRAW_POINTS = 64;

export interface ValidationError {
  ok: false;
  message: string;
}

export interface ValidationOk<T> {
  ok: true;
  value: T;
}

export type ValidationResult<T> = ValidationOk<T> | ValidationError;

function isGameId(v: unknown): v is GameId {
  return typeof v === "string" && (ALL_GAME_IDS as readonly string[]).includes(v);
}

function validateGameOptions(raw: unknown): GameOptions {
  const src = isRecord(raw) ? raw : {};
  const contentRating = src.contentRating === "mature" ? "mature" : "family";
  const difficulty =
    src.difficulty === "easy" || src.difficulty === "medium" || src.difficulty === "hard" || src.difficulty === "mixed"
      ? src.difficulty
      : DEFAULT_GAME_OPTIONS.difficulty;
  const options: GameOptions = {
    ...DEFAULT_GAME_OPTIONS,
    contentRating,
    difficulty,
  };
  if (src.questionDisplay === "tv_prompt_only" || src.questionDisplay === "tv_full") {
    options.questionDisplay = src.questionDisplay;
  }
  if (src.speedScoring === "off" || src.speedScoring === "bonus") {
    options.speedScoring = src.speedScoring;
  }
  if (finiteNumber(src.speedBonusMax)) {
    options.speedBonusMax = Math.max(0, Math.min(5000, Math.floor(src.speedBonusMax)));
  }
  if (finiteNumber(src.timelinePtsPerYearOff)) {
    options.timelinePtsPerYearOff = Math.max(1, Math.min(1000, Math.floor(src.timelinePtsPerYearOff)));
  }
  if (
    src.impostorCategory === "all" ||
    src.impostorCategory === "places" ||
    src.impostorCategory === "things" ||
    src.impostorCategory === "jobs" ||
    src.impostorCategory === "random"
  ) {
    options.impostorCategory = src.impostorCategory;
  }
  if (src.paddleMode === "pong" || src.paddleMode === "hockey") {
    options.paddleMode = src.paddleMode;
  }
  if (src.charadesMode === "solo" || src.charadesMode === "teams") {
    options.charadesMode = src.charadesMode;
  }
  if (isRecord(src.trailDash)) {
    const td = src.trailDash;
    options.trailDash = {
      botCount: finiteNumber(td.botCount) ? Math.max(0, Math.min(7, Math.floor(td.botCount))) : undefined,
      powerUpMode:
        td.powerUpMode === "off" || td.powerUpMode === "normal" || td.powerUpMode === "chaos"
          ? td.powerUpMode
          : undefined,
    };
  }
  return options;
}

function fail(message: string): ValidationError {
  return { ok: false, message };
}

function ok<T>(value: T): ValidationOk<T> {
  return { ok: true, value };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function finiteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function trimText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function validateDrawPoints(points: unknown): number[] | null {
  if (!Array.isArray(points) || points.length < 2 || points.length > MAX_DRAW_POINTS * 2) return null;
  const out: number[] = [];
  for (const p of points) {
    if (!finiteNumber(p) || p < 0 || p > 1) return null;
    out.push(p);
  }
  return out;
}

export function validateGameAction(raw: unknown): ValidationResult<GameAction> {
  if (!isRecord(raw) || typeof raw.kind !== "string") return fail("Invalid action");

  switch (raw.kind) {
    case "submit_text": {
      const text = trimText(raw.text, MAX_TEXT_LEN);
      if (!text) return fail("Invalid text");
      return ok({ kind: "submit_text", text });
    }
    case "vote": {
      const optionId = trimText(raw.optionId, 64);
      if (!optionId) return fail("Invalid vote");
      return ok({ kind: "vote", optionId });
    }
    case "vote_pair": {
      const winnerId = trimText(raw.winnerId, 64);
      if (!winnerId) return fail("Invalid vote_pair");
      return ok({ kind: "vote_pair", winnerId });
    }
    case "trivia_answer": {
      if (!finiteNumber(raw.choiceIndex) || raw.choiceIndex < 0 || raw.choiceIndex > 9) return fail("Invalid trivia_answer");
      return ok({ kind: "trivia_answer", choiceIndex: raw.choiceIndex });
    }
    case "year_slider": {
      if (!finiteNumber(raw.year) || raw.year < 0 || raw.year > 3000) return fail("Invalid year_slider");
      return ok({ kind: "year_slider", year: raw.year });
    }
    case "would_you_rather": {
      if (raw.choice !== "a" && raw.choice !== "b") return fail("Invalid would_you_rather");
      return ok({ kind: "would_you_rather", choice: raw.choice });
    }
    case "draw_stroke": {
      const points = validateDrawPoints(raw.points);
      if (!points) return fail("Invalid draw_stroke");
      const color = typeof raw.color === "string" ? raw.color.slice(0, 32) : "#fff";
      const width = raw.width !== undefined ? (finiteNumber(raw.width) ? Math.max(1, Math.min(32, raw.width)) : 4) : undefined;
      return ok({ kind: "draw_stroke", points, color, width });
    }
    case "draw_undo":
    case "draw_clear":
    case "charades_correct":
    case "charades_skip":
    case "forbidden_correct":
    case "forbidden_skip":
    case "forbidden_foul":
    case "fleet_duel_random":
    case "fleet_duel_ready":
    case "agent_pass":
    case "advance":
      return ok({ kind: raw.kind });
    case "draw_tool": {
      if (raw.tool !== "pen" && raw.tool !== "eraser") return fail("Invalid draw_tool");
      const width = raw.width !== undefined ? (finiteNumber(raw.width) ? Math.max(1, Math.min(32, raw.width)) : 4) : undefined;
      return ok({ kind: "draw_tool", tool: raw.tool, width });
    }
    case "assign_role": {
      if (!isRecord(raw.assignments)) return fail("Invalid assign_role");
      const assignments: Record<string, string> = {};
      for (const [k, v] of Object.entries(raw.assignments)) {
        if (typeof v !== "string") return fail("Invalid assign_role");
        assignments[k.slice(0, 64)] = v.slice(0, 64);
      }
      return ok({ kind: "assign_role", assignments });
    }
    case "impostor_accuse": {
      const targetId = trimText(raw.targetId, 64);
      if (!targetId) return fail("Invalid impostor_accuse");
      return ok({ kind: "impostor_accuse", targetId });
    }
    case "impostor_guess": {
      if (!finiteNumber(raw.itemIndex) || raw.itemIndex < 0 || raw.itemIndex > 99) return fail("Invalid impostor_guess");
      return ok({ kind: "impostor_guess", itemIndex: raw.itemIndex });
    }
    case "trail_dash_turn": {
      if (raw.direction !== "left" && raw.direction !== "right" && raw.direction !== "none") return fail("Invalid trail_dash_turn");
      return ok({ kind: "trail_dash_turn", direction: raw.direction });
    }
    case "trail_dash_jump":
    case "trail_dash_fire":
      return ok({ kind: raw.kind });
    case "hot_seat_pick": {
      const submissionId = trimText(raw.submissionId, 64);
      if (!submissionId) return fail("Invalid hot_seat_pick");
      return ok({ kind: "hot_seat_pick", submissionId });
    }
    case "hot_seat_skip":
      return ok({ kind: "hot_seat_skip" });
    case "dike_bid": {
      if (!finiteNumber(raw.amount) || raw.amount < 0 || raw.amount > 1_000_000) return fail("Invalid dike_bid");
      return ok({ kind: "dike_bid", amount: Math.floor(raw.amount) });
    }
    case "block_stack_input": {
      const allowed = ["left", "right", "rotate_cw", "rotate_ccw", "soft_drop", "hard_drop", "hold"] as const;
      if (!allowed.includes(raw.input as (typeof allowed)[number])) return fail("Invalid block_stack_input");
      return ok({ kind: "block_stack_input", input: raw.input as (typeof allowed)[number] });
    }
    case "spectrum_guess": {
      if (!finiteNumber(raw.value) || raw.value < 0 || raw.value > 100) return fail("Invalid spectrum_guess");
      return ok({ kind: "spectrum_guess", value: raw.value });
    }
    case "split_vote": {
      if (raw.side !== "a" && raw.side !== "b") return fail("Invalid split_vote");
      return ok({ kind: "split_vote", side: raw.side });
    }
    case "crowd_predict":
    case "crowd_answer": {
      if (!finiteNumber(raw.choiceIndex) || raw.choiceIndex < 0 || raw.choiceIndex > 9) return fail("Invalid crowd choice");
      return ok({ kind: raw.kind, choiceIndex: raw.choiceIndex });
    }
    case "star_rate": {
      const submissionId = trimText(raw.submissionId, 64);
      if (!submissionId || !finiteNumber(raw.stars) || raw.stars < 1 || raw.stars > 5) return fail("Invalid star_rate");
      return ok({ kind: "star_rate", submissionId, stars: Math.floor(raw.stars) });
    }
    case "fleet_duel_place": {
      if (!finiteNumber(raw.shipIndex) || !finiteNumber(raw.x) || !finiteNumber(raw.y)) return fail("Invalid fleet_duel_place");
      if (typeof raw.horizontal !== "boolean") return fail("Invalid fleet_duel_place");
      return ok({
        kind: "fleet_duel_place",
        shipIndex: raw.shipIndex,
        x: raw.x,
        y: raw.y,
        horizontal: raw.horizontal,
      });
    }
    case "fleet_duel_fire": {
      if (!finiteNumber(raw.x) || !finiteNumber(raw.y)) return fail("Invalid fleet_duel_fire");
      const targetId = raw.targetId === undefined ? undefined : trimText(raw.targetId, 64) ?? undefined;
      return ok({ kind: "fleet_duel_fire", x: raw.x, y: raw.y, targetId });
    }
    case "fleet_duel_bet": {
      if (raw.market !== "next_elimination" && raw.market !== "most_hits") return fail("Invalid fleet_duel_bet");
      const pick = trimText(raw.pick, 64);
      if (!pick || !finiteNumber(raw.amount) || raw.amount < 0) return fail("Invalid fleet_duel_bet");
      return ok({ kind: "fleet_duel_bet", market: raw.market, pick, amount: Math.floor(raw.amount) });
    }
    case "four_in_a_row_drop": {
      if (!finiteNumber(raw.column) || raw.column < 0 || raw.column > 6) return fail("Invalid four_in_a_row_drop");
      return ok({ kind: "four_in_a_row_drop", column: Math.floor(raw.column) });
    }
    case "tic_tac_toe_move": {
      if (!finiteNumber(raw.cell) || raw.cell < 0 || raw.cell > 8) return fail("Invalid tic_tac_toe_move");
      return ok({ kind: "tic_tac_toe_move", cell: Math.floor(raw.cell) });
    }
    case "agent_clue": {
      const word = trimText(raw.word, MAX_TEXT_LEN);
      if (!word || !finiteNumber(raw.count) || raw.count < 0 || raw.count > 25) return fail("Invalid agent_clue");
      return ok({ kind: "agent_clue", word, count: Math.floor(raw.count) });
    }
    case "agent_guess": {
      if (!finiteNumber(raw.index) || raw.index < 0 || raw.index > 24) return fail("Invalid agent_guess");
      return ok({ kind: "agent_guess", index: Math.floor(raw.index) });
    }
    case "hangman_letter": {
      const letter = trimText(raw.letter, 4);
      if (!letter) return fail("Invalid hangman_letter");
      return ok({ kind: "hangman_letter", letter });
    }
    case "paddle_move": {
      if (!finiteNumber(raw.y) || raw.y < 0 || raw.y > 1) return fail("Invalid paddle_move");
      return ok({ kind: "paddle_move", y: raw.y });
    }
    case "grid_blast_input": {
      const allowed = ["up", "down", "left", "right", "bomb"] as const;
      if (!allowed.includes(raw.input as (typeof allowed)[number])) return fail("Invalid grid_blast_input");
      return ok({ kind: "grid_blast_input", input: raw.input as (typeof allowed)[number] });
    }
    default:
      return fail("Unknown action kind");
  }
}

export function validateClientMessage(raw: unknown): ValidationResult<ClientMessage> {
  if (!isRecord(raw) || typeof raw.type !== "string") return fail("Invalid message");

  switch (raw.type) {
    case "ping":
    case "check_room":
    case "start_game":
    case "start_session":
    case "next_session_game":
    case "clear_session_playlist":
    case "play_again":
    case "return_to_lobby":
    case "pause_game":
    case "resume_game":
      return ok({ type: raw.type });
    case "join": {
      if (raw.role !== "host" && raw.role !== "player") return fail("Invalid join role");
      const nickname = raw.nickname === undefined ? undefined : trimText(raw.nickname, MAX_NICKNAME_LEN) ?? undefined;
      const playerId = raw.playerId === undefined ? undefined : trimText(raw.playerId, 64) ?? undefined;
      const colorIndex = raw.colorIndex === undefined ? undefined : finiteNumber(raw.colorIndex) ? raw.colorIndex : undefined;
      return ok({ type: "join", role: raw.role, nickname, playerId, colorIndex });
    }
    case "select_game": {
      if (!isGameId(raw.gameId)) return fail("Invalid game");
      return ok({ type: "select_game", gameId: raw.gameId });
    }
    case "set_game_options": {
      if (!isGameId(raw.gameId)) return fail("Invalid game");
      return ok({ type: "set_game_options", gameId: raw.gameId, options: validateGameOptions(raw.options) });
    }
    case "set_session_playlist": {
      if (!Array.isArray(raw.gameIds)) return fail("Invalid playlist");
      const gameIds: GameId[] = [];
      for (const id of raw.gameIds) {
        if (!isGameId(id)) return fail("Invalid playlist");
        gameIds.push(id);
      }
      return ok({ type: "set_session_playlist", gameIds });
    }
    case "player_action":
    case "host_action": {
      const actionResult = validateGameAction(raw.action);
      if (!actionResult.ok) return actionResult;
      return ok({ type: raw.type, action: actionResult.value });
    }
    case "extend_timer": {
      if (!finiteNumber(raw.extraMs) || raw.extraMs < 0 || raw.extraMs > 600_000) return fail("Invalid extend_timer");
      return ok({ type: "extend_timer", extraMs: raw.extraMs });
    }
    case "update_profile": {
      const nickname = raw.nickname === undefined ? undefined : trimText(raw.nickname, MAX_NICKNAME_LEN) ?? undefined;
      const colorIndex = raw.colorIndex === undefined ? undefined : finiteNumber(raw.colorIndex) ? raw.colorIndex : undefined;
      return ok({ type: "update_profile", nickname, colorIndex });
    }
    default:
      return fail("Unknown message type");
  }
}

export function validateRawMessageSize(raw: string): ValidationResult<string> {
  if (raw.length > MAX_MESSAGE_BYTES) return fail("Message too large");
  return ok(raw);
}
