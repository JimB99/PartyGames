import {
  createPaddleState,
  paddleGameOver,
  paddleWinner,
  setPaddleY,
  tickPaddleState,
  type GameAction,
  type PaddleState,
} from "@party-games/shared";

export const PADDLE_POINTS_PER_GOAL = 200;
export const PADDLE_WIN_BONUS = 400;

function paddleTeamIds(playerIds: string[], playerId: string): string[] {
  const idx = playerIds.indexOf(playerId);
  if (idx < 0) return [];
  if (playerIds.length <= 2) return [playerId];
  const onLeft = idx < 2;
  return playerIds.filter((_, i) => (i < 2) === onLeft);
}

function teamScore(playerIds: string[], players: Array<{ id: string; score: number }>, side: "left" | "right"): number {
  const teamIds = playerIds.filter((_, i) => (i < 2 ? "left" : "right") === side);
  return players.filter((p) => teamIds.includes(p.id)).reduce((sum, p) => sum + p.score, 0);
}

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

function computePaddleRoundScores(state: PaddleClashGameState): Record<string, number> {
  const winner = paddleWinner(state.paddle);
  const scores: Record<string, number> = {};
  for (const p of state.paddle.players) {
    scores[p.id] = p.score * PADDLE_POINTS_PER_GOAL;
  }
  if (!winner) return scores;

  const winners =
    state.playerIds.length <= 2
      ? [winner]
      : paddleTeamIds(state.playerIds, winner);
  for (const id of winners) {
    scores[id] = (scores[id] ?? 0) + PADDLE_WIN_BONUS;
  }
  return scores;
}

export function onPaddleClashTick(state: PaddleClashGameState): PaddleClashGameState {
  if (state.phase === "playing") {
    state.paddle = tickPaddleState(state.paddle);
    if (paddleGameOver(state.paddle)) {
      state.roundScores = computePaddleRoundScores(state);
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
  const leftScore = teamScore(state.playerIds, state.paddle.players, "left");
  const rightScore = teamScore(state.playerIds, state.paddle.players, "right");
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
      leftScore,
      rightScore,
    },
  };
}

export function paddleClashPlayerView(state: PaddleClashGameState, playerId: string) {
  const idx = state.playerIds.indexOf(playerId);
  const side = idx === 0 || (state.playerIds.length > 2 && idx < 2) ? "left" : "right";
  const winnerId = paddleGameOver(state.paddle) ? paddleWinner(state.paddle) : null;
  const myTeam = paddleTeamIds(state.playerIds, playerId);
  const myScore = state.paddle.players
    .filter((p) => myTeam.includes(p.id))
    .reduce((sum, p) => sum + p.score, 0);
  const opponentScore = state.paddle.players
    .filter((p) => !myTeam.includes(p.id))
    .reduce((sum, p) => sum + p.score, 0);
  const won = winnerId !== null && myTeam.includes(winnerId);
  const lost = winnerId !== null && !won;
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
      won,
      lost,
    },
  };
}
