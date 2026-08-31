import { pickRandom, type GameAction, type RoomContext } from "@party-games/shared";

export type SplitPhase = "instructions" | "vote" | "reveal" | "scoreboard" | "ended";

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
  timerTotalMs: number | null;
  scenario: SplitScenario;
  votes: Record<string, "a" | "b">;
  roundScores: Record<string, number>;
  usedIndices: number[];
  pool: SplitScenario[];
  playerIds: string[];
}

const VOTE_MS = 25000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 5000;
const INSTRUCTIONS_MS = 5000;

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
    timerEndsAt: Date.now() + INSTRUCTIONS_MS,
    timerTotalMs: INSTRUCTIONS_MS,
    scenario,
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
  const minority: "a" | "b" =
    counts.a === counts.b ? (Math.random() < 0.5 ? "a" : "b") : counts.a < counts.b ? "a" : "b";
  state.roundScores = {};
  for (const pid of playerIds) {
    if (state.votes[pid] === minority) state.roundScores[pid] = 1000;
  }
}

function setTimer(state: SplitState, ms: number): void {
  state.timerTotalMs = ms;
  state.timerEndsAt = Date.now() + ms;
}

export function advanceSplit(state: SplitState, playerIds: string[]): SplitState {
  if (state.phase === "instructions") {
    state.phase = "vote";
    state.votes = {};
    setTimer(state, VOTE_MS);
    return state;
  }
  if (state.phase === "vote") {
    scoreSplit(state, playerIds);
    state.phase = "reveal";
    setTimer(state, REVEAL_MS);
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    setTimer(state, SCOREBOARD_MS);
    return state;
  }
  if (state.phase === "scoreboard") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.timerEndsAt = null;
      state.timerTotalMs = null;
      return state;
    }
    state.round += 1;
    state.scenario = pickScenario(state);
    state.phase = "instructions";
    setTimer(state, INSTRUCTIONS_MS);
    return state;
  }
  return state;
}

export function onSplitAction(state: SplitState, playerId: string, action: GameAction, ctx: RoomContext): SplitState {
  if (action.kind === "split_vote" && state.phase === "vote") {
    state.votes[playerId] = action.side;
    if (Object.keys(state.votes).length >= ctx.playerIds.length) {
      return advanceSplit(state, ctx.playerIds);
    }
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
    timerTotalMs: state.timerTotalMs,
    data: {
      scenario: state.scenario,
      voteCounts:
        state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended"
          ? voteCounts
          : undefined,
      submitCount: state.phase === "vote" ? Object.keys(state.votes).length : undefined,
      playerCount: state.playerIds.length,
      roundScores: state.roundScores,
    },
  };
}

export function splitPlayerView(state: SplitState, playerId: string) {
  const voteCounts = { a: 0, b: 0 };
  for (const v of Object.values(state.votes)) voteCounts[v]++;
  const myVote = state.votes[playerId];
  let minority: "a" | "b" | null = null;
  if (state.phase === "reveal" || state.phase === "scoreboard") {
    minority = voteCounts.a === voteCounts.b ? null : voteCounts.a < voteCounts.b ? "a" : "b";
  }
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      scenario: state.phase !== "instructions" ? state.scenario : undefined,
      voteCounts:
        state.phase === "reveal" || state.phase === "scoreboard" ? voteCounts : undefined,
      myPoints: state.roundScores[playerId],
    },
    playerData: {
      voted: myVote !== undefined,
      myVote,
      minoritySide: minority,
      wonRound: minority !== null && myVote === minority,
    },
  };
}
