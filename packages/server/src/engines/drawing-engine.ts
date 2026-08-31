import { pickRandom, shuffle, uniqueId, isSpeedScoringEnabled, scoreByAnswerRank, type GameAction, type GameOptions, type RoomContext } from "@party-games/shared";
import { clearPhaseTimer, startPhaseTimer } from "./phase-timer.js";

export type DrawPhase = "instructions" | "drawing" | "guessing" | "reveal" | "scoreboard" | "ended";

export interface Stroke {
  points: number[];
  color: string;
  width: number;
  erase?: boolean;
}

export interface DrawState {
  phase: DrawPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  playerIds: string[];
  drawerIndex: number;
  word: string;
  strokes: Stroke[];
  drawerTool: "pen" | "eraser";
  drawerWidth: number;
  guesses: Record<string, string>;
  guessTimes: Record<string, number>;
  guessPhaseStartedAt: number | null;
  correctGuessers: string[];
  roundScores: Record<string, number>;
  usedWords: string[];
  wordsPool: string[];
  gameOptions?: GameOptions;
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
    ...startPhaseTimer(5000),
    playerIds,
    drawerIndex: 0,
    word,
    strokes: [],
    drawerTool: "pen",
    drawerWidth: 4,
    guesses: {},
    guessTimes: {},
    guessPhaseStartedAt: null,
    correctGuessers: [],
    roundScores: {},
    usedWords: [word],
    wordsPool: words,
  };
}

export function advanceDraw(state: DrawState, words: string[], playerIds: string[]): DrawState {
  if (state.phase === "instructions") {
    state.phase = "drawing";
    Object.assign(state, startPhaseTimer(DRAW_MS));
    state.strokes = [];
    state.guesses = {};
    state.correctGuessers = [];
    return state;
  }
  if (state.phase === "drawing") {
    state.phase = "guessing";
    state.guessPhaseStartedAt = Date.now();
    state.timerTotalMs = GUESS_MS;
    state.timerEndsAt = state.guessPhaseStartedAt! + GUESS_MS;
    state.guessTimes = {};
    return state;
  }
  if (state.phase === "guessing") {
    scoreDraw(state, playerIds, state.gameOptions);
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
    state.drawerIndex = (state.drawerIndex + 1) % playerIds.length;
    const available = words.filter((w) => !state.usedWords.includes(w));
    const word = available.length > 0 ? pickRandom(available) : pickRandom(words);
    state.word = word;
    state.usedWords.push(word);
    state.phase = "instructions";
    Object.assign(state, startPhaseTimer(5000));
    return state;
  }
  return state;
}

function scoreDraw(state: DrawState, playerIds: string[], gameOptions?: GameOptions) {
  const drawerId = playerIds[state.drawerIndex];
  state.roundScores = {};
  const normalizedWord = state.word.toLowerCase().trim();
  const seen = new Set<string>();
  const speedOn = gameOptions ? isSpeedScoringEnabled(gameOptions) : false;
  const correctEntries: Array<{ playerId: string; answeredAt: number }> = [];

  for (const [playerId, guess] of Object.entries(state.guesses)) {
    if (playerId === drawerId) continue;
    const g = guess.toLowerCase().trim();
    if (g === normalizedWord && !seen.has(g)) {
      seen.add(g);
      state.correctGuessers.push(playerId);
      if (speedOn && state.guessTimes[playerId] !== undefined) {
        correctEntries.push({ playerId, answeredAt: state.guessTimes[playerId] });
      } else if (!speedOn) {
        state.roundScores[playerId] = 500;
        state.roundScores[drawerId] = (state.roundScores[drawerId] ?? 0) + 250;
      }
    }
  }

  if (speedOn && correctEntries.length > 0) {
    const ranked = scoreByAnswerRank(correctEntries, Math.max(1, playerIds.length), 0.5);
    for (const [playerId, score] of Object.entries(ranked)) {
      state.roundScores[playerId] = score.points;
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
  if (action.kind === "draw_tool" && state.phase === "drawing" && playerId === drawerId) {
    state.drawerTool = action.tool;
    if (action.width !== undefined) state.drawerWidth = Math.max(2, Math.min(16, action.width));
  }
  if (action.kind === "draw_stroke" && state.phase === "drawing" && playerId === drawerId) {
    const width = action.width ?? state.drawerWidth;
    const erase = state.drawerTool === "eraser" || action.color === "erase";
    state.strokes.push({ points: action.points, color: erase ? "#000" : action.color, width, erase });
  }
  if (action.kind === "draw_undo" && state.phase === "drawing" && playerId === drawerId) {
    state.strokes.pop();
  }
  if (action.kind === "draw_clear" && state.phase === "drawing" && playerId === drawerId) {
    state.strokes = [];
  }
  if (action.kind === "submit_text" && state.phase === "guessing" && playerId !== drawerId) {
    if (state.guesses[playerId] === undefined) {
      state.guesses[playerId] = action.text.slice(0, 60);
      state.guessTimes[playerId] = Date.now();
    }
    const normalizedWord = state.word.toLowerCase().trim();
    if (action.text.toLowerCase().trim() === normalizedWord) {
      scoreDraw(state, ctx.playerIds, ctx.gameOptions);
      state.phase = "reveal";
      Object.assign(state, startPhaseTimer(REVEAL_MS));
      state.guessPhaseStartedAt = null;
      return state;
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceDraw(state, state.wordsPool, ctx.playerIds);
  }
  if (action.kind === "advance" && state.phase === "drawing" && playerId === drawerId) {
    return advanceDraw(state, state.wordsPool, ctx.playerIds);
  }
  return state;
}

export function onDrawTick(state: DrawState, words?: string[], playerIds?: string[]): DrawState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceDraw(state, words ?? state.wordsPool, playerIds ?? state.playerIds);
}

export function drawHostView(state: DrawState, playerIds: string[]) {
  const drawerId = playerIds[state.drawerIndex];
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
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
    timerTotalMs: state.timerTotalMs,
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
      isDrawer,
      drawerId: isDrawer ? undefined : drawerId,
      word: isDrawer && state.phase !== "ended" && state.phase !== "reveal" && state.phase !== "scoreboard" ? state.word : undefined,
      guessed: state.guesses[playerId] !== undefined,
      myGuess: state.guesses[playerId],
    },
  };
}
