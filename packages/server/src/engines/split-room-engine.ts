import { pickRandom, type GameAction, type RoomContext } from "@party-games/shared";

export type SplitPhase = "instructions" | "submit" | "vote" | "reveal" | "scoreboard" | "ended";

export interface SplitScenario {
  text: string;
  labelA: string;
  labelB: string;
}

export interface SplitState {
  phase: SplitPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  scenario: SplitScenario;
  submissions: Record<string, string>;
  votes: Record<string, "a" | "b">;
  roundScores: Record<string, number>;
  usedIndices: number[];
  pool: SplitScenario[];
  playerIds: string[];
}

const SUBMIT_MS = 45000;
const VOTE_MS = 25000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 5000;

function pickScenario(state: SplitState): SplitScenario {
  const available = state.pool.map((s, i) => i).filter((i) => !state.usedIndices.includes(i));
  const idx = available.length > 0 ? pickRandom(available) : Math.floor(Math.random() * state.pool.length);
  state.usedIndices.push(idx);
  return state.pool[idx];
}

export function createSplitState(pool: SplitScenario[], playerIds: string[], maxRounds = 4): SplitState {
  const scenario = pickRandom(pool);
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    scenario,
    submissions: {},
    votes: {},
    roundScores: {},
    usedIndices: [pool.indexOf(scenario)],
    pool,
    playerIds,
  };
}

function scoreSplit(state: SplitState, playerIds: string[]): void {
  const counts = { a: 0, b: 0 };
  for (const pid of playerIds) {
    const v = state.votes[pid];
    if (v) counts[v]++;
  }
  const minority: "a" | "b" = counts.a === counts.b ? (Math.random() < 0.5 ? "a" : "b") : counts.a < counts.b ? "a" : "b";
  state.roundScores = {};
  for (const pid of playerIds) {
    if (state.votes[pid] === minority) state.roundScores[pid] = 1000;
  }
}

export function advanceSplit(state: SplitState, playerIds: string[]): SplitState {
  if (state.phase === "instructions") {
    state.phase = "submit";
    state.timerEndsAt = Date.now() + SUBMIT_MS;
    state.submissions = {};
    state.votes = {};
    return state;
  }
  if (state.phase === "submit") {
    state.phase = "vote";
    state.timerEndsAt = Date.now() + VOTE_MS;
    return state;
  }
  if (state.phase === "vote") {
    scoreSplit(state, playerIds);
    state.phase = "reveal";
    state.timerEndsAt = Date.now() + REVEAL_MS;
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    state.timerEndsAt = Date.now() + SCOREBOARD_MS;
    return state;
  }
  if (state.phase === "scoreboard") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.timerEndsAt = null;
      return state;
    }
    state.round += 1;
    state.scenario = pickScenario(state);
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
    return state;
  }
  return state;
}

export function onSplitAction(state: SplitState, playerId: string, action: GameAction, ctx: RoomContext): SplitState {
  if (action.kind === "submit_text" && state.phase === "submit") {
    state.submissions[playerId] = action.text.slice(0, 120);
  }
  if (action.kind === "split_vote" && state.phase === "vote") {
    state.votes[playerId] = action.side;
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceSplit(state, ctx.playerIds);
  }
  return state;
}

export function onSplitTick(state: SplitState): SplitState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceSplit(state, state.playerIds);
}

export function splitHostView(state: SplitState) {
  const voteCounts = { a: 0, b: 0 };
  for (const v of Object.values(state.votes)) voteCounts[v]++;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      scenario: state.scenario,
      submissions: state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended"
        ? Object.entries(state.submissions).map(([playerId, text]) => ({ playerId, text }))
        : undefined,
      voteCounts: state.phase === "reveal" || state.phase === "scoreboard" ? voteCounts : undefined,
      roundScores: state.roundScores,
    },
  };
}

export function splitPlayerView(state: SplitState, playerId: string) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: { scenario: state.scenario },
    playerData: {
      submitted: state.submissions[playerId] !== undefined,
      voted: state.votes[playerId] !== undefined,
    },
  };
}
