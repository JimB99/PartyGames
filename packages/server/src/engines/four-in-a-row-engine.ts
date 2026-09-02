import type { GameAction } from "@party-games/shared";
import {
  activePlayers,
  advanceCfBracket,
  checkConnectFourWinner,
  computeCfRoundScores,
  createFourInARowState,
  currentCfMatch,
  currentTurnPlayer,
  dropDisc,
  findConnectFourWinningCells,
  markForPlayer,
  nextPlayableMatchIndex,
  resetBoard,
  type FourInARowState,
} from "@party-games/shared";

export type { FourInARowState } from "@party-games/shared";

const INSTRUCTIONS_MS = 4000;
const MATCH_END_MS = 5000;

export function createFourInARowGameState(playerIds: string[]): FourInARowState {
  return createFourInARowState(playerIds);
}

function startPlaying(state: FourInARowState): FourInARowState {
  state.phase = "playing";
  state.timerEndsAt = null;
  state.timerTotalMs = null;
  return state;
}

function finishMatch(state: FourInARowState, winnerId: string | null, isDraw = false): FourInARowState {
  if (isDraw && state.drawReplayCount < 1) {
    state.drawReplayCount += 1;
    resetBoard(state);
    state.winnerId = null;
    state.winningCells = null;
    state.phase = "playing";
    return state;
  }

  state.winnerId = winnerId;
  if (state.playerIds.length === 2) {
    state.championId = winnerId;
    state.phase = "ended";
    state.roundScores = computeCfRoundScores(state);
    return state;
  }

  const match = currentCfMatch(state);
  if (match) match.winner = winnerId;

  let nextIndex = state.matchIndex + 1;
  const playable = nextPlayableMatchIndex(state.bracket, nextIndex);
  if (playable !== null && playable < state.bracket.length) {
    state.matchIndex = playable;
    state.round += 1;
    resetBoard(state);
    state.drawReplayCount = 0;
    state.phase = "playing";
    state.timerEndsAt = null;
    state.timerTotalMs = null;
    return state;
  }

  if (state.matchIndex < state.bracket.length - 1) {
    state.matchIndex += 1;
    const skipTo = nextPlayableMatchIndex(state.bracket, state.matchIndex);
    if (skipTo !== null) {
      state.matchIndex = skipTo;
      state.round += 1;
      resetBoard(state);
      state.drawReplayCount = 0;
      state.phase = "playing";
      return state;
    }
  }

  state.round += 1;
  state.phase = "match_end";
  state.timerEndsAt = Date.now() + MATCH_END_MS;
  state.timerTotalMs = MATCH_END_MS;
  return state;
}

function startNextBracketRound(state: FourInARowState): FourInARowState {
  resetBoard(state);
  return advanceCfBracket(state);
}

export function onFourInARowAction(state: FourInARowState, playerId: string, action: GameAction): FourInARowState {
  if (action.kind === "advance") {
    if (state.phase === "instructions") return startPlaying(state);
    if (state.phase === "match_end") return startNextBracketRound(state);
    return state;
  }
  if (action.kind === "four_in_a_row_drop" && state.phase === "playing") {
    if (currentTurnPlayer(state) !== playerId) return state;
    const mark = markForPlayer(state, playerId);
    const result = dropDisc(state.board, action.column, mark);
    if (!result) return state;
    state.board = result.board;
    const outcome = checkConnectFourWinner(state.board);
    if (outcome === "x" || outcome === "o") {
      state.winningCells = findConnectFourWinningCells(state.board);
      const pair = activePlayers(state);
      const winner = outcome === "x" ? pair?.[0] : pair?.[1];
      return finishMatch(state, winner ?? null);
    }
    if (outcome === "draw") {
      state.winningCells = null;
      return finishMatch(state, null, true);
    }
    state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  }
  return state;
}

export function onFourInARowTick(state: FourInARowState): FourInARowState {
  if (state.timerEndsAt && Date.now() >= state.timerEndsAt) {
    if (state.phase === "instructions") return startPlaying(state);
    if (state.phase === "match_end") return startNextBracketRound(state);
  }
  return state;
}

export function fourInARowHostView(state: FourInARowState) {
  const pair = activePlayers(state);
  const match = currentCfMatch(state);
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      board: state.board,
      currentTurn: currentTurnPlayer(state),
      championId: state.championId,
      matchIndex: state.matchIndex,
      bracketSize: state.bracket.length,
      players: pair,
      winnerId: state.winnerId,
      winningCells: state.winningCells,
      roundScores: state.roundScores,
      kingOfHill: state.playerIds.length > 2,
      match,
    },
  };
}

export function fourInARowPlayerView(state: FourInARowState, playerId: string) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      board: state.board,
      players: activePlayers(state),
      winnerId: state.winnerId,
      winningCells: state.winningCells,
      kingOfHill: state.playerIds.length > 2,
    },
    playerData: {
      myTurn: currentTurnPlayer(state) === playerId,
      mark: markForPlayer(state, playerId),
      inMatch: activePlayers(state)?.includes(playerId) ?? state.playerIds.length === 2,
    },
  };
}
