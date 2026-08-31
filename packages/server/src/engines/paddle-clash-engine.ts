import {
  createPaddleState,
  paddleGameOver,
  paddleWinner,
  setPaddleY,
  tickPaddleState,
  type GameAction,
  type PaddleState,
} from "@party-games/shared";

export type PaddleClashPhase = "instructions" | "playing" | "round_end" | "ended";

export interface PaddleClashGameState {
  phase: PaddleClashPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  paddle: PaddleState;
  roundScores: Record<string, number>;
  playerIds: string[];
  mode: "pong" | "hockey";
}

const INSTRUCTIONS_MS = 5000;

export function createPaddleClashState(
  playerIds: string[],
  mode: "pong" | "hockey" = "pong",
): PaddleClashGameState {
  return {
    phase: "instructions",
    round: 1,
    maxRounds: 1,
    timerEndsAt: Date.now() + INSTRUCTIONS_MS,
    timerTotalMs: INSTRUCTIONS_MS,
    paddle: createPaddleState(playerIds, mode),
    roundScores: {},
    playerIds,
    mode,
  };
}

export function onPaddleClashAction(
  state: PaddleClashGameState,
  playerId: string,
  action: GameAction,
  _playerIds: string[],
): PaddleClashGameState {
  if (action.kind === "paddle_move" && state.phase === "playing") {
    state.paddle = setPaddleY(state.paddle, playerId, action.y);
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    state.phase = "playing";
    state.timerEndsAt = null;
    state.timerTotalMs = null;
  }
  return state;
}

export function onPaddleClashTick(state: PaddleClashGameState): PaddleClashGameState {
  if (state.phase === "playing") {
    state.paddle = tickPaddleState(state.paddle);
    if (paddleGameOver(state.paddle)) {
      const winner = paddleWinner(state.paddle);
      if (winner) state.roundScores[winner] = 2000;
      state.phase = "ended";
      state.timerEndsAt = null;
    }
  }
  if (state.timerEndsAt && Date.now() >= state.timerEndsAt && state.phase === "instructions") {
    state.phase = "playing";
    state.timerEndsAt = null;
    state.timerTotalMs = null;
  }
  return state;
}

export function paddleClashHostView(state: PaddleClashGameState) {
  const winnerId = paddleGameOver(state.paddle) ? paddleWinner(state.paddle) : null;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      ball: state.paddle.ball,
      players: state.paddle.players,
      mode: state.mode,
      roundScores: state.roundScores,
      winnerId,
    },
  };
}

export function paddleClashPlayerView(state: PaddleClashGameState, playerId: string) {
  const idx = state.playerIds.indexOf(playerId);
  const side = idx === 0 || (state.playerIds.length > 2 && idx < 2) ? "left" : "right";
  const winnerId = paddleGameOver(state.paddle) ? paddleWinner(state.paddle) : null;
  const myScore = state.paddle.players.find((p) => p.id === playerId)?.score ?? 0;
  const opponentScore =
    state.paddle.players.find((p) => p.id !== playerId)?.score ??
    state.paddle.players.reduce((max, p) => (p.id !== playerId && p.score > max ? p.score : max), 0);
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      scores: state.paddle.players.map((p) => ({ id: p.id, score: p.score })),
      winnerId,
    },
    playerData: {
      side,
      myScore,
      opponentScore,
      won: winnerId === playerId,
      lost: winnerId !== null && winnerId !== playerId,
    },
  };
}
