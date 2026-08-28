import type { GameAction } from "@party-games/shared";
import {
  activePlayers,
  CF_WIN_TARGET,
  checkConnectFourWinner,
  computeCfRoundScores,
  createConnectFourState,
  currentTurnPlayer,
  dropDisc,
  markForPlayer,
  nextChallenger,
  resetBoard,
  type ConnectFourState,
} from "@party-games/shared";

export type { ConnectFourState } from "@party-games/shared";

const INSTRUCTIONS_MS = 4000;
const MATCH_END_MS = 5000;

export function createCfGameState(playerIds: string[]): ConnectFourState {
  return createConnectFourState(playerIds);
}

function startPlaying(state: ConnectFourState): ConnectFourState {
  state.phase = "playing";
  state.timerEndsAt = null;
  state.timerTotalMs = null;
  return state;
}

function finishMatch(state: ConnectFourState, winnerId: string | null): ConnectFourState {
  state.winnerId = winnerId;
  if (state.playerIds.length === 2) {
    state.phase = "ended";
    state.roundScores = computeCfRoundScores(state);
    return state;
  }
  if (winnerId === state.championId) state.championWins++;
  else if (winnerId === state.challengerId) state.challengerWins++;

  if (state.championWins >= CF_WIN_TARGET) {
    state.phase = "ended";
    state.winnerId = state.championId;
    state.roundScores = computeCfRoundScores(state);
    return state;
  }
  if (state.challengerWins >= CF_WIN_TARGET) {
    state.phase = "ended";
    state.winnerId = state.challengerId;
    state.roundScores = computeCfRoundScores(state);
    return state;
  }

  state.phase = "match_end";
  state.timerEndsAt = Date.now() + MATCH_END_MS;
  state.timerTotalMs = MATCH_END_MS;
  return state;
}

function startNextMatch(state: ConnectFourState): ConnectFourState {
  if (state.winnerId && state.winnerId !== state.championId) {
    state.championId = state.winnerId;
  }
  state.challengerId = nextChallenger(state);
  resetBoard(state);
  state.phase = "playing";
  state.timerEndsAt = null;
  state.timerTotalMs = null;
  return state;
}

export function onCfAction(state: ConnectFourState, playerId: string, action: GameAction): ConnectFourState {
  if (action.kind === "advance") {
    if (state.phase === "instructions") return startPlaying(state);
    if (state.phase === "match_end") return startNextMatch(state);
    return state;
  }
  if (action.kind === "connect_four_drop" && state.phase === "playing") {
    if (currentTurnPlayer(state) !== playerId) return state;
    const mark = markForPlayer(state, playerId);
    const result = dropDisc(state.board, action.column, mark);
    if (!result) return state;
    state.board = result.board;
    const outcome = checkConnectFourWinner(state.board);
    if (outcome === "x" || outcome === "o") {
      const pair = activePlayers(state);
      const winner = outcome === "x" ? pair?.[0] : pair?.[1];
      return finishMatch(state, winner ?? null);
    }
    if (outcome === "draw") return finishMatch(state, null);
    state.currentPlayerIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  }
  return state;
}

export function onCfTick(state: ConnectFourState): ConnectFourState {
  if (state.timerEndsAt && Date.now() >= state.timerEndsAt) {
    if (state.phase === "instructions") return startPlaying(state);
    if (state.phase === "match_end") return startNextMatch(state);
  }
  return state;
}

export function cfHostView(state: ConnectFourState) {
  const pair = activePlayers(state);
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
      challengerId: state.challengerId,
      championWins: state.championWins,
      challengerWins: state.challengerWins,
      winTarget: CF_WIN_TARGET,
      players: pair,
      winnerId: state.winnerId,
      roundScores: state.roundScores,
      kingOfHill: state.playerIds.length > 2,
    },
  };
}

export function cfPlayerView(state: ConnectFourState, playerId: string) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      board: state.board,
      championWins: state.championWins,
      challengerWins: state.challengerWins,
      winTarget: CF_WIN_TARGET,
      kingOfHill: state.playerIds.length > 2,
    },
    playerData: {
      myTurn: currentTurnPlayer(state) === playerId,
      mark: markForPlayer(state, playerId),
      inMatch: activePlayers(state)?.includes(playerId) ?? false,
    },
  };
}
