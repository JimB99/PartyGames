import type { GameAction } from "@party-games/shared";
import {
  applyBlockStackInput,
  computeBlockStackRoundScores,
  createBlockStackState,
  getMergedBoard,
  resetBlockStackRound,
  startBlockStackPlaying,
  tickBlockStackState,
  type BlockStackInput,
  type BlockStackState,
} from "@party-games/shared";

export type { BlockStackState } from "@party-games/shared";

const INPUT_MAP: Record<string, BlockStackInput> = {
  left: "left",
  right: "right",
  rotate_cw: "rotate_cw",
  rotate_ccw: "rotate_ccw",
  soft_drop: "soft_drop",
  hard_drop: "hard_drop",
  hold: "hold",
};

export function createBlockStackGameState(playerIds: string[]): BlockStackState {
  return createBlockStackState(playerIds);
}

function advanceBlockStack(state: BlockStackState, playerIds: string[]): BlockStackState {
  if (state.phase === "instructions") {
    return startBlockStackPlaying(state);
  }
  if (state.phase === "round_end") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.timerEndsAt = null;
      return state;
    }
    state.round += 1;
    const fresh = resetBlockStackRound(state, playerIds);
    fresh.round = state.round;
    for (const p of fresh.players) {
      /* spawn on first tick */
    }
    return fresh;
  }
  return state;
}

export function onBlockStackAction(state: BlockStackState, playerId: string, action: GameAction, playerIds: string[]): BlockStackState {
  if (action.kind === "advance") {
    return advanceBlockStack(state, playerIds);
  }
  if (action.kind === "block_stack_input" && state.phase === "playing") {
    const input = INPUT_MAP[action.input];
    if (!input) return state;
    const player = state.players.find((p) => p.id === playerId);
    if (player) applyBlockStackInput(player, input);
  }
  return state;
}

export function onBlockStackTick(state: BlockStackState, playerIds: string[]): BlockStackState {
  if (state.phase === "playing") {
    return tickBlockStackState(state);
  }
  if (state.timerEndsAt && Date.now() >= state.timerEndsAt) {
    if (state.phase === "instructions" || state.phase === "round_end") {
      return advanceBlockStack(state, playerIds);
    }
  }
  return state;
}

function serializePlayer(p: import("@party-games/shared").BlockStackPlayer) {
  return {
    id: p.id,
    board: getMergedBoard(p),
    next: p.next,
    hold: p.hold,
    alive: p.alive,
    score: p.score,
    lines: p.lines,
    deathRank: p.deathRank,
  };
}

export function blockStackHostView(state: BlockStackState) {
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

export function blockStackPlayerView(state: BlockStackState, playerId: string) {
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
          hold: player.hold,
          alive: player.alive,
          score: player.score,
        }
      : {},
  };
}

export function blockStackRoundScores(state: BlockStackState): Record<string, number> {
  if (state.phase === "ended" || state.phase === "round_end") {
    return state.roundScores;
  }
    return computeBlockStackRoundScores(state);
}
