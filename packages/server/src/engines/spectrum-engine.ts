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
    usedIndices: [pool.indexOf(pair)],
    pool,
    playerIds,
  };
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
}

export function advanceSpectrum(state: SpectrumState): SpectrumState {
  if (state.phase === "instructions") {
    state.phase = "clue";
    state.timerTotalMs = CLUE_MS;
    state.timerEndsAt = Date.now() + CLUE_MS;
    state.clue = "";
    state.guesses = {};
    return state;
  }
  if (state.phase === "clue") {
    if (!state.clue.trim()) {
      state.phase = "scoreboard";
      state.timerTotalMs = SCOREBOARD_MS;
      state.timerEndsAt = Date.now() + SCOREBOARD_MS;
      return state;
    }
    state.phase = "guess";
    state.timerTotalMs = GUESS_MS;
    state.timerEndsAt = Date.now() + GUESS_MS;
    return state;
  }
  if (state.phase === "guess") {
    scoreSpectrum(state);
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
    state.pair = pickPair(state);
    state.target = Math.floor(Math.random() * 101);
    state.clueGiverId = state.playerIds[(state.round - 1) % state.playerIds.length];
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
    return state;
  }
  return state;
}

function guessersExpected(state: SpectrumState): number {
  return state.playerIds.filter((id) => id !== state.clueGiverId).length;
}

function allGuessesIn(state: SpectrumState): boolean {
  return Object.keys(state.guesses).length >= guessersExpected(state);
}

export function onSpectrumAction(state: SpectrumState, playerId: string, action: GameAction, ctx: RoomContext): SpectrumState {
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
    if (allGuessesIn(state)) {
      scoreSpectrum(state);
      state.phase = "reveal";
      state.timerTotalMs = REVEAL_MS;
      state.timerEndsAt = Date.now() + REVEAL_MS;
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceSpectrum(state);
  }
  void ctx;
  return state;
}

export function onSpectrumTick(state: SpectrumState): SpectrumState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceSpectrum(state);
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
