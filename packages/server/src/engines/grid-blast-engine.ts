import {
  applyGridBlastInput,
  createGridBlastState,
  gridBlastAliveCount,
  gridBlastRoundScores,
  tickGridBlastState,
  type GameAction,
  type GridBlastInput,
  type GridBlastState,
} from "@party-games/shared";

export type GridBlastPhase = "instructions" | "playing" | "round_end" | "ended";

export interface GridBlastGameState {
  phase: GridBlastPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  battle: GridBlastState;
  roundScores: Record<string, number>;
  playerIds: string[];
}

const ROUND_END_MS = 5000;

export function createGridBlastGameState(playerIds: string[], maxRounds = 3): GridBlastGameState {
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    battle: createGridBlastState(playerIds),
    roundScores: {},
    playerIds,
  };
}

function advanceGridBlast(state: GridBlastGameState): GridBlastGameState {
  if (state.phase === "instructions") {
    state.phase = "playing";
    state.timerEndsAt = null;
    state.battle = createGridBlastState(state.playerIds);
    return state;
  }
  if (state.phase === "round_end") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.timerEndsAt = null;
      return state;
    }
    state.round += 1;
    state.battle = createGridBlastState(state.playerIds);
    state.phase = "playing";
    state.timerEndsAt = null;
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
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceGridBlast(state);
  }
  if (action.kind === "advance" && state.phase === "round_end") {
    return advanceGridBlast(state);
  }
  if (action.kind === "grid_blast_input" && state.phase === "playing") {
    applyGridBlastInput(state.battle, playerId, action.input as GridBlastInput);
    if (gridBlastAliveCount(state.battle) <= 1) {
      const scores = gridBlastRoundScores(state.battle);
      for (const [id, pts] of Object.entries(scores)) {
        state.roundScores[id] = (state.roundScores[id] ?? 0) + pts;
      }
      state.phase = "round_end";
      state.timerEndsAt = Date.now() + ROUND_END_MS;
    }
  }
  return state;
}

export function onGridBlastTick(state: GridBlastGameState): GridBlastGameState {
  if (state.phase === "playing") {
    tickGridBlastState(state.battle);
    if (gridBlastAliveCount(state.battle) <= 1) {
      const scores = gridBlastRoundScores(state.battle);
      for (const [id, pts] of Object.entries(scores)) {
        state.roundScores[id] = (state.roundScores[id] ?? 0) + pts;
      }
      state.phase = "round_end";
      state.timerEndsAt = Date.now() + ROUND_END_MS;
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
    data: {
      grid: state.battle.grid,
      players: state.battle.players,
      bombs: state.battle.bombs.filter((b) => !b.exploded),
      fires: state.battle.fires,
      deathOrder: state.battle.deathOrder,
      roundScores: state.roundScores,
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
    data: {
      players: state.battle.players.map((p) => ({
        id: p.id,
        alive: p.alive,
        x: p.x,
        y: p.y,
      })),
    },
    playerData: {
      alive: player?.alive ?? false,
      x: player?.x,
      y: player?.y,
      maxBombs: player?.maxBombs,
      blastRange: player?.blastRange,
    },
  };
}
