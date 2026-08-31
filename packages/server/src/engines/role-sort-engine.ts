import { pickRandom, shuffle, type GameAction, type RoomContext } from "@party-games/shared";
import { clearPhaseTimer, startPhaseTimer } from "./phase-timer.js";

export type RoleSortPhase = "instructions" | "assign" | "reveal" | "scoreboard" | "ended";

export interface RoleSortState {
  phase: RoleSortPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  playerIds: string[];
  category: string;
  roles: string[];
  assignments: Record<string, Record<string, string>>;
  results: Record<string, { role: string; count: number }>;
  roundScores: Record<string, number>;
  cumulativeScores: Record<string, number>;
}

const INSTRUCTIONS_MS = 5000;
const SCOREBOARD_MS = 5000;
const ASSIGN_MS = 60000;
const REVEAL_MS = 10000;

export function createRoleSortState(category: string, roles: string[], playerIds: string[]): RoleSortState {
  const shuffledRoles = shuffle(roles).slice(0, playerIds.length);
  return {
    phase: "instructions",
    round: 1,
    maxRounds: 3,
    ...startPhaseTimer(INSTRUCTIONS_MS),
    playerIds,
    category,
    roles: shuffledRoles.length >= playerIds.length ? shuffledRoles : [...shuffledRoles, ...roles].slice(0, playerIds.length),
    assignments: {},
    results: {},
    roundScores: {},
    cumulativeScores: {},
  };
}

export function advanceRoleSort(state: RoleSortState, playerIds: string[]): RoleSortState {
  if (state.phase === "instructions") {
    state.phase = "assign";
    Object.assign(state, startPhaseTimer(ASSIGN_MS));
    state.assignments = {};
    return state;
  }
  if (state.phase === "assign") {
    computeResults(state, playerIds);
    state.phase = "reveal";
    Object.assign(state, startPhaseTimer(REVEAL_MS));
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    Object.assign(state, startPhaseTimer(SCOREBOARD_MS));
    return state;
  }
  if (state.phase === "scoreboard") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      Object.assign(state, clearPhaseTimer());
      return state;
    }
    state.round += 1;
    state.roles = shuffle(state.roles);
    state.phase = "assign";
    Object.assign(state, startPhaseTimer(ASSIGN_MS));
    state.assignments = {};
    return state;
  }
  return state;
}

function computeResults(state: RoleSortState, playerIds: string[]) {
  state.results = {};
  state.roundScores = {};
  for (const targetId of playerIds) {
    const counts: Record<string, number> = {};
    for (const [assignerId, map] of Object.entries(state.assignments)) {
      if (assignerId === targetId) continue;
      const role = map[targetId];
      if (role) counts[role] = (counts[role] ?? 0) + 1;
    }
    let bestRole = state.roles[0];
    let bestCount = 0;
    for (const [role, count] of Object.entries(counts)) {
      if (count > bestCount) {
        bestCount = count;
        bestRole = role;
      }
    }
    state.results[targetId] = { role: bestRole, count: bestCount };
    for (const [assignerId, map] of Object.entries(state.assignments)) {
      if (map[targetId] === bestRole && assignerId !== targetId) {
        state.roundScores[assignerId] = (state.roundScores[assignerId] ?? 0) + 500;
      }
    }
  }
  for (const [playerId, pts] of Object.entries(state.roundScores)) {
    state.cumulativeScores[playerId] = (state.cumulativeScores[playerId] ?? 0) + pts;
  }
}

export function onRoleSortAction(
  state: RoleSortState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): RoleSortState {
  if (action.kind === "assign_role" && state.phase === "assign") {
    state.assignments[playerId] = action.assignments;
    if (Object.keys(state.assignments).length >= ctx.playerIds.length) {
      return advanceRoleSort(state, ctx.playerIds);
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceRoleSort(state, ctx.playerIds);
  }
  return state;
}

export function onRoleSortTick(state: RoleSortState, playerIds: string[]): RoleSortState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceRoleSort(state, playerIds);
}

export function roleSortHostView(state: RoleSortState) {
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      category: state.category,
      roles: state.roles,
      results: showReveal ? state.results : undefined,
      assignments: showReveal ? state.assignments : undefined,
      roundScores: state.roundScores,
      cumulativeScores: state.cumulativeScores,
      assignmentCount: Object.keys(state.assignments).length,
      submittedPlayerIds: Object.keys(state.assignments),
      playerCount: state.playerIds.length,
    },
  };
}

export function roleSortPlayerView(state: RoleSortState, playerId: string, playerIds: string[]) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      category: state.phase !== "instructions" ? state.category : undefined,
      roles: state.phase === "assign" ? state.roles : undefined,
      players: state.phase === "assign" ? playerIds.filter((id) => id !== playerId) : undefined,
      myResult: state.phase === "reveal" || state.phase === "scoreboard" ? state.results[playerId] : undefined,
    },
    playerData: {
      assigned: state.assignments[playerId] !== undefined,
      assignments: state.assignments[playerId],
    },
  };
}
