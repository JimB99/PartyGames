import { pickRandom, type GameAction, type RoomContext } from "@party-games/shared";

export type SpectrumPhase = "instructions" | "clue" | "guess" | "reveal" | "scoreboard" | "ended";

export interface SpectrumPair {
  left: string;
  right: string;
}

export interface SpectrumState {
  phase: SpectrumPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  pair: SpectrumPair;
  target: number;
  clueGiverId: string;
  clue: string;
  guesses: Record<string, number>;
  roundScores: Record<string, number>;
  cumulativeScores: Record<string, number>;
  lastRoundScores: Record<string, number>;
  usedIndices: number[];
  pool: SpectrumPair[];
  playerIds: string[];
}

const CLUE_MS = 30000;
const GUESS_MS = 30000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 5000;

function pickPair(state: SpectrumState): SpectrumPair {
  const available = state.pool.map((_, i) => i).filter((i) => !state.usedIndices.includes(i));
  const idx = available.length > 0 ? pickRandom(available) : Math.floor(Math.random() * state.pool.length);
  state.usedIndices.push(idx);
  return state.pool[idx];
}

export function createSpectrumState(pool: SpectrumPair[], playerIds: string[], maxRounds = 4): SpectrumState {
  const pair = pickRandom(pool);
  return {
    phase: "instructions",
    round: 1,
    maxRounds: Math.min(maxRounds, playerIds.length),
    timerEndsAt: Date.now() + 5000,
    timerTotalMs: 5000,
    pair,
    target: Math.floor(Math.random() * 101),
    clueGiverId: playerIds[0],
    clue: "",
    guesses: {},
    roundScores: {},
    cumulativeScores: {},
    lastRoundScores: {},
    usedIndices: [pool.indexOf(pair)],
    pool,
    playerIds: [...playerIds],
  };
}

function activePlayerIds(state: SpectrumState, ctx?: RoomContext): string[] {
  return ctx?.playerIds?.length ? ctx.playerIds : state.playerIds;
}

function guessersExpected(state: SpectrumState, ctx?: RoomContext): string[] {
  return activePlayerIds(state, ctx).filter((id) => id !== state.clueGiverId);
}

function allGuessesIn(state: SpectrumState, ctx?: RoomContext): boolean {
  const expected = guessersExpected(state, ctx);
  return expected.every((id) => state.guesses[id] !== undefined);
}

function scoreSpectrum(state: SpectrumState): void {
  state.roundScores = {};
  for (const [pid, guess] of Object.entries(state.guesses)) {
    if (pid === state.clueGiverId) continue;
    const diff = Math.abs(guess - state.target);
    state.roundScores[pid] = Math.max(0, 1000 - diff * 10);
  }
  const best = Object.entries(state.roundScores).sort((a, b) => b[1] - a[1])[0];
  if (best) state.roundScores[state.clueGiverId] = Math.floor(best[1] * 0.5);
  state.lastRoundScores = { ...state.roundScores };
  for (const [pid, pts] of Object.entries(state.roundScores)) {
    state.cumulativeScores[pid] = (state.cumulativeScores[pid] ?? 0) + pts;
  }
}

export function advanceSpectrum(state: SpectrumState, ctx?: RoomContext): SpectrumState {
  if (state.phase === "instructions") {
    state.phase = "clue";
    state.timerTotalMs = CLUE_MS;
    state.timerEndsAt = Date.now() + CLUE_MS;
    state.clue = "";
    state.guesses = {};
    return state;
  }
  if (state.phase === "clue") {
    state.phase = "guess";
    state.timerTotalMs = GUESS_MS;
    state.timerEndsAt = Date.now() + GUESS_MS;
    return state;
  }
  if (state.phase === "guess") {
    scoreSpectrum(state);
    state.phase = "reveal";
    state.timerTotalMs = REVEAL_MS;
    state.timerEndsAt = Date.now() + REVEAL_MS;
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    state.timerTotalMs = SCOREBOARD_MS;
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
    state.pair = pickPair(state);
    state.target = Math.floor(Math.random() * 101);
    const ids = activePlayerIds(state, ctx);
    state.clueGiverId = ids[(state.round - 1) % ids.length];
    state.phase = "instructions";
    state.timerTotalMs = 5000;
    state.timerEndsAt = Date.now() + 5000;
    return state;
  }
  return state;
}

export function onSpectrumAction(state: SpectrumState, playerId: string, action: GameAction, ctx: RoomContext): SpectrumState {
  state.playerIds = [...ctx.playerIds];

  if (action.kind === "submit_text" && state.phase === "clue" && playerId === state.clueGiverId) {
    state.clue = action.text.slice(0, 80);
    if (state.clue.trim()) {
      state.phase = "guess";
      state.timerTotalMs = GUESS_MS;
      state.timerEndsAt = Date.now() + GUESS_MS;
    }
  }
  if (action.kind === "spectrum_guess" && state.phase === "guess" && playerId !== state.clueGiverId) {
    if (state.guesses[playerId] === undefined) {
      state.guesses[playerId] = Math.max(0, Math.min(100, Math.round(action.value)));
    }
    if (allGuessesIn(state, ctx)) {
      scoreSpectrum(state);
      state.phase = "reveal";
      state.timerTotalMs = REVEAL_MS;
      state.timerEndsAt = Date.now() + REVEAL_MS;
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceSpectrum(state, ctx);
  }
  return state;
}

export function onSpectrumTick(state: SpectrumState, ctx?: RoomContext): SpectrumState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceSpectrum(state, ctx);
}

export function spectrumHostView(state: SpectrumState) {
  const showTarget = state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      pair: state.pair,
      clueGiverId: state.clueGiverId,
      clue: state.phase !== "clue" ? state.clue : undefined,
      target: showTarget ? state.target : undefined,
      guesses: showTarget ? state.guesses : undefined,
      roundScores: state.roundScores,
      cumulativeScores: state.cumulativeScores,
      lastRoundScores: state.lastRoundScores,
    },
  };
}

export function spectrumPlayerView(state: SpectrumState, playerId: string) {
  const isClueGiver = playerId === state.clueGiverId;
  const showTarget = isClueGiver && state.phase === "clue";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: { pair: state.pair, clue: state.phase === "guess" || state.phase === "reveal" ? state.clue : undefined },
    playerData: {
      isClueGiver,
      target: showTarget ? state.target : undefined,
      clueSubmitted: state.clue.trim().length > 0,
      guessed: state.guesses[playerId] !== undefined,
      myGuess: state.guesses[playerId],
    },
  };
}
