import type { GameAction } from "@party-games/shared";
import {
  applyTetrisInput,
  computeTetrisRoundScores,
  createTetrisState,
  getMergedBoard,
  resetTetrisRound,
  startTetrisPlaying,
  tickTetrisState,
  type TetrisInput,
  type TetrisState,
} from "@party-games/shared";

export type { TetrisState } from "@party-games/shared";

const INPUT_MAP: Record<string, TetrisInput> = {
  left: "left",
  right: "right",
  rotate_cw: "rotate_cw",
  rotate_ccw: "rotate_ccw",
  soft_drop: "soft_drop",
  hard_drop: "hard_drop",
};

export function createTetrisGameState(playerIds: string[]): TetrisState {
  return createTetrisState(playerIds);
}

function advanceTetris(state: TetrisState, playerIds: string[]): TetrisState {
  if (state.phase === "instructions") {
    return startTetrisPlaying(state);
  }
  if (state.phase === "round_end") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.timerEndsAt = null;
      return state;
    }
    state.round += 1;
    const fresh = resetTetrisRound(state, playerIds);
    fresh.round = state.round;
    for (const p of fresh.players) {
      /* spawn on first tick */
    }
    return fresh;
  }
  return state;
}

export function onTetrisAction(state: TetrisState, playerId: string, action: GameAction, playerIds: string[]): TetrisState {
  if (action.kind === "advance") {
    return advanceTetris(state, playerIds);
  }
  if (action.kind === "tetris_input" && state.phase === "playing") {
    const input = INPUT_MAP[action.input];
    if (!input) return state;
    const player = state.players.find((p) => p.id === playerId);
    if (player) applyTetrisInput(player, input);
  }
  return state;
}

export function onTetrisTick(state: TetrisState, playerIds: string[]): TetrisState {
  if (state.phase === "playing") {
    return tickTetrisState(state);
  }
  if (state.timerEndsAt && Date.now() >= state.timerEndsAt) {
    if (state.phase === "instructions" || state.phase === "round_end") {
      return advanceTetris(state, playerIds);
    }
  }
  return state;
}

function serializePlayer(p: import("@party-games/shared").TetrisPlayer) {
  return {
    id: p.id,
    board: getMergedBoard(p),
    next: p.next,
    alive: p.alive,
    score: p.score,
    lines: p.lines,
    deathRank: p.deathRank,
  };
}

export function tetrisHostView(state: TetrisState) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      players: state.players.map(serializePlayer),
      deathOrder: state.deathOrder,
      roundWinner: state.roundWinner,
      roundScores: state.roundScores,
    },
  };
}

export function tetrisPlayerView(state: TetrisState, playerId: string) {
  const player = state.players.find((p) => p.id === playerId);
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      players: state.players.map((p) => ({
        id: p.id,
        alive: p.alive,
        score: p.score,
        deathRank: p.deathRank,
      })),
      deathOrder: state.deathOrder,
      roundWinner: state.roundWinner,
      roundScores: state.roundScores,
    },
    playerData: player
      ? {
          board: getMergedBoard(player),
          next: player.next,
          alive: player.alive,
          score: player.score,
        }
      : {},
  };
}

export function tetrisRoundScores(state: TetrisState): Record<string, number> {
  if (state.phase === "ended" || state.phase === "round_end") {
    return state.roundScores;
  }
    return computeTetrisRoundScores(state);
}
