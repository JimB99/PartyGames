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
  paddle: PaddleState;
  roundScores: Record<string, number>;
  playerIds: string[];
  mode: "pong" | "hockey";
}

export function createPaddleClashState(
  playerIds: string[],
  mode: "pong" | "hockey" = "pong",
): PaddleClashGameState {
  return {
    phase: "instructions",
    round: 1,
    maxRounds: 1,
    timerEndsAt: Date.now() + 5000,
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
  }
  return state;
}

export function paddleClashHostView(state: PaddleClashGameState) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      ball: state.paddle.ball,
      players: state.paddle.players,
      mode: state.mode,
      roundScores: state.roundScores,
    },
  };
}

export function paddleClashPlayerView(state: PaddleClashGameState, playerId: string) {
  const idx = state.playerIds.indexOf(playerId);
  const side = idx === 0 || (state.playerIds.length > 2 && idx < 2) ? "left" : "right";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      scores: state.paddle.players.map((p) => ({ id: p.id, score: p.score })),
    },
    playerData: {
      side,
      myScore: state.paddle.players.find((p) => p.id === playerId)?.score ?? 0,
    },
  };
}
