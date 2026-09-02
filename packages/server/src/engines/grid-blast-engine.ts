import {
  applyGridBlastInput,
  createGridBlastState,
  finalizeGridBlastRound,
  gridBlastAliveCount,
  tickGridBlastState,
  type GameAction,
  type GridBlastInput,
} from "@party-games/shared";
import { clearPhaseTimer, startPhaseTimer } from "./phase-timer.js";

export type GridBlastPhase = "instructions" | "playing" | "round_end" | "ended";

export interface GridBlastGameState {
  phase: GridBlastPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  battle: import("@party-games/shared").GridBlastState;
  roundScores: Record<string, number>;
  lastRoundScores: Record<string, number>;
  playerIds: string[];
}

const ROUND_END_MS = 5000;
const PLAYING_MS = 120_000;

export function createGridBlastGameState(playerIds: string[], maxRounds = 3): GridBlastGameState {
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    ...startPhaseTimer(5000),
    battle: createGridBlastState(playerIds),
    roundScores: {},
    lastRoundScores: {},
    playerIds,
  };
}

function finishPlayingRound(state: GridBlastGameState): GridBlastGameState {
  const scores = finalizeGridBlastRound(state.battle);
  state.lastRoundScores = scores;
  for (const [id, pts] of Object.entries(scores)) {
    state.roundScores[id] = (state.roundScores[id] ?? 0) + pts;
  }
  state.phase = "round_end";
  Object.assign(state, startPhaseTimer(ROUND_END_MS));
  return state;
}

function advanceGridBlast(state: GridBlastGameState): GridBlastGameState {
  if (state.phase === "instructions") {
    state.phase = "playing";
    state.battle = createGridBlastState(state.playerIds);
    Object.assign(state, startPhaseTimer(PLAYING_MS));
    return state;
  }
  if (state.phase === "round_end") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      Object.assign(state, clearPhaseTimer());
      return state;
    }
    state.round += 1;
    state.battle = createGridBlastState(state.playerIds);
    state.phase = "playing";
    Object.assign(state, startPhaseTimer(PLAYING_MS));
    return state;
  }
  return state;
}

export function onGridBlastAction(
  state: GridBlastGameState,
  playerId: string,
  action: GameAction,
  _playerIds: string[],
): GridBlastGameState {
  if (action.kind === "advance" && (state.phase === "instructions" || state.phase === "round_end")) {
    return advanceGridBlast(state);
  }
  if (action.kind === "grid_blast_input" && state.phase === "playing") {
    applyGridBlastInput(state.battle, playerId, action.input as GridBlastInput);
    if (gridBlastAliveCount(state.battle) <= 1 && state.battle.players.length > 1) {
      return finishPlayingRound(state);
    }
  }
  return state;
}

export function onGridBlastTick(state: GridBlastGameState): GridBlastGameState {
  if (state.phase === "playing") {
    tickGridBlastState(state.battle);
    const timeUp = Boolean(state.timerEndsAt && Date.now() >= state.timerEndsAt);
    const lastStanding = gridBlastAliveCount(state.battle) <= 1 && state.battle.players.length > 1;
    if (lastStanding || timeUp) {
      return finishPlayingRound(state);
    }
    return state;
  }
  if (state.timerEndsAt && Date.now() >= state.timerEndsAt && state.phase === "round_end") {
    return advanceGridBlast(state);
  }
  if (state.timerEndsAt && Date.now() >= state.timerEndsAt && state.phase === "instructions") {
    return advanceGridBlast(state);
  }
  return state;
}

export function gridBlastHostView(state: GridBlastGameState) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      grid: state.battle.grid,
      players: state.battle.players,
      bombs: state.battle.bombs.filter((b) => !b.exploded),
      fires: state.battle.fires,
      powerUps: state.battle.powerUps,
      deathOrder: state.battle.deathOrder,
      roundScores: state.roundScores,
      lastRoundScores: state.lastRoundScores,
    },
  };
}

export function gridBlastPlayerView(state: GridBlastGameState, playerId: string) {
  const player = state.battle.players.find((p) => p.id === playerId);
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      players: state.battle.players.map((p) => ({
        id: p.id,
        alive: p.alive,
        x: p.x,
        y: p.y,
        canKick: p.canKick,
        maxBombs: p.maxBombs,
        blastRange: p.blastRange,
      })),
    },
    playerData: {
      alive: player?.alive ?? false,
      x: player?.x,
      y: player?.y,
      maxBombs: player?.maxBombs,
      blastRange: player?.blastRange,
      canKick: player?.canKick ?? false,
    },
  };
}
