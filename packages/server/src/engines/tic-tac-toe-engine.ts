import type { GameAction } from "@party-games/shared";
import {
  advanceBracket,
  applyMove,
  checkWinner,
  createTicTacToeState,
  currentMatch,
  emptyBoard,
  findTttWinningCells,
  isPlayerTurn,
  matchFinished,
  tttPlacementScores,
  type TicTacToeState,
} from "@party-games/shared";

export type { TicTacToeState } from "@party-games/shared";

const INSTRUCTIONS_MS = 4000;
const MATCH_END_MS = 4000;

export function createTttGameState(playerIds: string[]): TicTacToeState {
  return createTicTacToeState(playerIds);
}

function startPlaying(state: TicTacToeState): TicTacToeState {
  state.phase = "playing";
  state.timerEndsAt = null;
  state.timerTotalMs = null;
  return state;
}

function finishMatch(state: TicTacToeState): TicTacToeState {
  const match = currentMatch(state);
  if (state.playerIds.length === 2) {
    state.championId = match?.winner ?? null;
    state.phase = "ended";
    state.timerEndsAt = null;
    state.roundScores = tttPlacementScores(state.playerIds, state.championId, state.bracket);
    return state;
  }
  if (state.matchIndex < state.bracket.length - 1) {
    state.matchIndex += 1;
    state.phase = "playing";
    state.timerEndsAt = null;
    state.timerTotalMs = null;
    return state;
  }
  state.phase = "match_end";
  state.timerEndsAt = Date.now() + MATCH_END_MS;
  state.timerTotalMs = MATCH_END_MS;
  return state;
}

export function onTttAction(state: TicTacToeState, playerId: string, action: GameAction): TicTacToeState {
  if (state.phase === "playing") {
    const active = currentMatch(state);
    if (active?.winner) return finishMatch(state);
  }
  if (action.kind === "advance") {
    if (state.phase === "instructions") return startPlaying(state);
    if (state.phase === "match_end") return advanceBracket(state);
    return state;
  }
  if (action.kind === "tic_tac_toe_move" && state.phase === "playing") {
    const match = currentMatch(state);
    if (!match || match.winner) return state;
    if (!isPlayerTurn(match, playerId)) return state;
    const updated = applyMove(match, action.cell);
    state.bracket[state.matchIndex] = updated;
    if (matchFinished(updated)) {
      if (checkWinner(updated.board) === "draw") {
        state.bracket[state.matchIndex] = {
          ...updated,
          board: emptyBoard(),
          turn: "x",
          winner: null,
        };
        return state;
      }
      return finishMatch(state);
    }
  }
  return state;
}

export function onTttTick(state: TicTacToeState): TicTacToeState {
  if (state.timerEndsAt && Date.now() >= state.timerEndsAt) {
    if (state.phase === "instructions") return startPlaying(state);
    if (state.phase === "match_end") return advanceBracket(state);
  }
  return state;
}

export function tttHostView(state: TicTacToeState) {
  const match = currentMatch(state);
  const winningCells = match ? findTttWinningCells(match.board) : null;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      match,
      matchIndex: state.matchIndex,
      bracketSize: state.bracket.length,
      championId: state.championId,
      roundScores: state.roundScores,
      playerIds: state.playerIds,
      winningCells,
    },
  };
}

export function tttPlayerView(state: TicTacToeState, playerId: string) {
  const match = currentMatch(state);
  const myTurn = match ? isPlayerTurn(match, playerId) : false;
  const inMatch = match && (match.xPlayer === playerId || match.oPlayer === playerId);
  const winningCells = match ? findTttWinningCells(match.board) : null;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      match,
      inMatch,
      roundScores: state.roundScores,
      championId: state.championId,
      winningCells,
    },
    playerData: { myTurn, mark: match?.xPlayer === playerId ? "x" : match?.oPlayer === playerId ? "o" : null },
  };
}
