import { pickRandom, shuffle, uniqueId, type GameAction, type RoomContext } from "@party-games/shared";

export type DrawPhase = "instructions" | "drawing" | "guessing" | "reveal" | "scoreboard" | "ended";

export interface Stroke {
  points: number[];
  color: string;
}

export interface DrawState {
  phase: DrawPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  playerIds: string[];
  drawerIndex: number;
  word: string;
  strokes: Stroke[];
  guesses: Record<string, string>;
  correctGuessers: string[];
  roundScores: Record<string, number>;
  usedWords: string[];
}

const DRAW_MS = 60000;
const GUESS_MS = 60000;
const REVEAL_MS = 5000;
const SCOREBOARD_MS = 4000;

export function createDrawState(words: string[], playerIds: string[], maxRounds?: number): DrawState {
  const word = pickRandom(words);
  return {
    phase: "instructions",
    round: 1,
    maxRounds: maxRounds ?? playerIds.length,
    timerEndsAt: Date.now() + 5000,
    playerIds,
    drawerIndex: 0,
    word,
    strokes: [],
    guesses: {},
    correctGuessers: [],
    roundScores: {},
    usedWords: [word],
  };
}

export function advanceDraw(state: DrawState, words: string[], playerIds: string[]): DrawState {
  if (state.phase === "instructions") {
    state.phase = "drawing";
    state.timerEndsAt = Date.now() + DRAW_MS;
    state.strokes = [];
    state.guesses = {};
    state.correctGuessers = [];
    return state;
  }
  if (state.phase === "drawing") {
    state.phase = "guessing";
    state.timerEndsAt = Date.now() + GUESS_MS;
    return state;
  }
  if (state.phase === "guessing") {
    scoreDraw(state, playerIds);
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
    state.drawerIndex = (state.drawerIndex + 1) % playerIds.length;
    const available = words.filter((w) => !state.usedWords.includes(w));
    const word = available.length > 0 ? pickRandom(available) : pickRandom(words);
    state.word = word;
    state.usedWords.push(word);
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
    return state;
  }
  return state;
}

function scoreDraw(state: DrawState, playerIds: string[]) {
  const drawerId = playerIds[state.drawerIndex];
  state.roundScores = {};
  const normalizedWord = state.word.toLowerCase().trim();
  const seen = new Set<string>();
  for (const [playerId, guess] of Object.entries(state.guesses)) {
    if (playerId === drawerId) continue;
    const g = guess.toLowerCase().trim();
    if (g === normalizedWord && !seen.has(g)) {
      seen.add(g);
      state.correctGuessers.push(playerId);
      state.roundScores[playerId] = 500;
      state.roundScores[drawerId] = (state.roundScores[drawerId] ?? 0) + 250;
    }
  }
}

export function onDrawAction(
  state: DrawState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): DrawState {
  const drawerId = ctx.playerIds[state.drawerIndex];
  if (action.kind === "draw_stroke" && state.phase === "drawing" && playerId === drawerId) {
    state.strokes.push({ points: action.points, color: action.color });
  }
  if (action.kind === "draw_clear" && state.phase === "drawing" && playerId === drawerId) {
    state.strokes = [];
  }
  if (action.kind === "submit_text" && state.phase === "guessing" && playerId !== drawerId) {
    state.guesses[playerId] = action.text.slice(0, 60);
    const normalizedWord = state.word.toLowerCase().trim();
    if (action.text.toLowerCase().trim() === normalizedWord) {
      return advanceDraw(state, [], ctx.playerIds);
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceDraw(state, [], ctx.playerIds);
  }
  return state;
}

export function onDrawTick(state: DrawState, words: string[], playerIds: string[]): DrawState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceDraw(state, words, playerIds);
}

export function drawHostView(state: DrawState, playerIds: string[]) {
  const drawerId = playerIds[state.drawerIndex];
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      drawerId,
      word: showReveal ? state.word : undefined,
      strokes: state.strokes,
      correctGuessers: state.correctGuessers,
      playerAnswers: showReveal
        ? Object.entries(state.guesses).map(([pid, guess]) => ({
            playerId: pid,
            answer: guess,
            correct: state.correctGuessers.includes(pid),
          }))
        : undefined,
      roundScores: state.roundScores,
    },
  };
}

export function drawPlayerView(state: DrawState, playerId: string, playerIds: string[]) {
  const drawerId = playerIds[state.drawerIndex];
  const isDrawer = playerId === drawerId;
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      isDrawer,
      strokes: state.strokes,
      drawerId: showReveal ? drawerId : undefined,
      word: showReveal ? state.word : undefined,
      playerAnswers: showReveal
        ? Object.entries(state.guesses).map(([pid, guess]) => ({
            playerId: pid,
            answer: guess,
            correct: state.correctGuessers.includes(pid),
          }))
        : undefined,
    },
    playerData: {
      word: isDrawer && state.phase !== "ended" && state.phase !== "reveal" && state.phase !== "scoreboard" ? state.word : undefined,
      guessed: state.guesses[playerId] !== undefined,
      myGuess: state.guesses[playerId],
    },
  };
}
