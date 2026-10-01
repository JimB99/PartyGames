import { pickRandom, shuffle, isSpeedScoringEnabled, scoreByAnswerRank, uniqueId, allDrawersReady, shouldAcceptStroke, type GameAction, type GameOptions, type RoomContext } from "@party-games/shared";
import { clearPhaseTimer, startPhaseTimer } from "./phase-timer.js";

export type DrawPhase = "instructions" | "drawing" | "guessing" | "reveal" | "scoreboard" | "ended";

export interface Stroke {
  id?: string;
  points: number[];
  color: string;
  width: number;
  erase?: boolean;
  revision?: number;
}

export interface PlayerDrawing {
  playerId: string;
  word: string;
  strokes: Stroke[];
  tool: "pen" | "eraser";
  width: number;
  revision: number;
}

export interface DrawState {
  phase: DrawPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  playerIds: string[];
  /** Legacy single-drawer index — used as guessIndex into guessOrder during guessing. */
  drawerIndex: number;
  drawings: Record<string, PlayerDrawing>;
  guessOrder: string[];
  guesses: Record<string, string>;
  guessTimes: Record<string, number>;
  guessPhaseStartedAt: number | null;
  correctGuessers: string[];
  roundScores: Record<string, number>;
  cumulativeScores: Record<string, number>;
  usedWords: string[];
  wordsPool: string[];
  gameOptions?: GameOptions;
  ready: Record<string, boolean>;
}

const DRAW_MS = 60000;
const GUESS_MS = 60000;
const REVEAL_MS = 5000;
const SCOREBOARD_MS = 4000;

function assignWords(words: string[], playerIds: string[], usedWords: string[]): Record<string, PlayerDrawing> {
  const available = words.filter((w) => !usedWords.includes(w));
  const pool = available.length >= playerIds.length ? [...available] : [...words];
  const shuffled = shuffle(pool);
  const drawings: Record<string, PlayerDrawing> = {};
  for (let i = 0; i < playerIds.length; i++) {
    const word = shuffled[i % shuffled.length];
    drawings[playerIds[i]] = {
      playerId: playerIds[i],
      word,
      strokes: [],
      tool: "pen",
      width: 4,
      revision: 0,
    };
  }
  return drawings;
}

export function createDrawState(words: string[], playerIds: string[], maxRounds?: number, gameOptions?: import("@party-games/shared").GameOptions): DrawState {
  const drawings = assignWords(words, playerIds, []);
  const usedWords = Object.values(drawings).map((d) => d.word);
  return {
    phase: "instructions",
    round: 1,
    maxRounds: maxRounds ?? playerIds.length,
    ...startPhaseTimer(5000, gameOptions),
    playerIds,
    drawerIndex: 0,
    drawings,
    guessOrder: [],
    guesses: {},
    guessTimes: {},
    guessPhaseStartedAt: null,
    correctGuessers: [],
    roundScores: {},
    cumulativeScores: {},
    usedWords,
    wordsPool: words,
    ready: {},
    gameOptions,
  };
}

function currentArtistId(state: DrawState): string | null {
  return state.guessOrder[state.drawerIndex] ?? null;
}

function currentDrawing(state: DrawState): PlayerDrawing | null {
  const id = currentArtistId(state);
  return id ? state.drawings[id] ?? null : null;
}

export function advanceDraw(state: DrawState, words: string[], playerIds: string[]): DrawState {
  if (state.phase === "instructions") {
    state.phase = "drawing";
    state.drawings = assignWords(words, playerIds, state.usedWords);
    for (const w of Object.values(state.drawings).map((d) => d.word)) {
      if (!state.usedWords.includes(w)) state.usedWords.push(w);
    }
    Object.assign(state, startPhaseTimer(DRAW_MS, state.gameOptions));
    state.guesses = {};
    state.correctGuessers = [];
    state.ready = {};
    return state;
  }
  if (state.phase === "drawing") {
    state.phase = "guessing";
    state.guessOrder = shuffle([...playerIds]);
    state.drawerIndex = 0;
    state.guessPhaseStartedAt = Date.now();
    state.timerTotalMs = GUESS_MS;
    state.timerEndsAt = state.guessPhaseStartedAt + GUESS_MS;
    state.guessTimes = {};
    state.guesses = {};
    state.correctGuessers = [];
    return state;
  }
  if (state.phase === "guessing") {
    scoreCurrentDrawing(state, playerIds, state.gameOptions);
    if (state.drawerIndex < state.guessOrder.length - 1) {
      state.drawerIndex += 1;
      state.guesses = {};
      state.guessTimes = {};
      state.guessPhaseStartedAt = Date.now();
      state.timerEndsAt = state.guessPhaseStartedAt + GUESS_MS;
      return state;
    }
    state.phase = "reveal";
    Object.assign(state, startPhaseTimer(REVEAL_MS, state.gameOptions));
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    Object.assign(state, startPhaseTimer(SCOREBOARD_MS, state.gameOptions));
    return state;
  }
  if (state.phase === "scoreboard") {
    for (const [id, pts] of Object.entries(state.roundScores)) {
      state.cumulativeScores[id] = (state.cumulativeScores[id] ?? 0) + pts;
    }
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.roundScores = { ...state.cumulativeScores };
      Object.assign(state, clearPhaseTimer());
      return state;
    }
    state.round += 1;
    state.roundScores = {};
    state.correctGuessers = [];
    state.guesses = {};
    state.guessTimes = {};
    state.phase = "instructions";
    Object.assign(state, startPhaseTimer(5000, state.gameOptions));
    return state;
  }
  return state;
}

export function applyStrokeToDrawing(
  drawing: PlayerDrawing,
  action: { points: number[]; color: string; width?: number; id?: string; revision?: number },
): void {
  if (!shouldAcceptStroke(action.revision, drawing.revision)) return;
  const erase = drawing.tool === "eraser" || action.color === "erase";
  drawing.strokes.push({
    id: action.id ?? uniqueId(),
    points: action.points,
    color: erase ? "transparent" : action.color,
    width: action.width ?? drawing.width,
    erase,
    revision: action.revision ?? drawing.revision,
  });
}

export function undoDrawingStrokes(drawing: PlayerDrawing): void {
  drawing.strokes.pop();
  drawing.revision += 1;
}

export function clearDrawingStrokes(drawing: PlayerDrawing): void {
  drawing.strokes = [];
  drawing.revision += 1;
}

function scoreCurrentDrawing(state: DrawState, playerIds: string[], gameOptions?: GameOptions) {
  const artistId = currentArtistId(state);
  const drawing = currentDrawing(state);
  if (!artistId || !drawing) return;

  const normalizedWord = drawing.word.toLowerCase().trim();
  const speedOn = gameOptions ? isSpeedScoringEnabled(gameOptions) : false;
  const correctEntries: Array<{ playerId: string; answeredAt: number }> = [];

  for (const [playerId, guess] of Object.entries(state.guesses)) {
    if (playerId === artistId) continue;
    const g = guess.toLowerCase().trim();
    if (g === normalizedWord) {
      if (!state.correctGuessers.includes(playerId)) {
        state.correctGuessers.push(playerId);
      }
      if (speedOn && state.guessTimes[playerId] !== undefined) {
        correctEntries.push({ playerId, answeredAt: state.guessTimes[playerId] });
      } else if (!speedOn) {
        state.roundScores[playerId] = (state.roundScores[playerId] ?? 0) + 500;
        state.roundScores[artistId] = (state.roundScores[artistId] ?? 0) + 250;
      }
    }
  }

  if (speedOn && correctEntries.length > 0) {
    const ranked = scoreByAnswerRank(correctEntries, Math.max(1, playerIds.length - 1), 0.5);
    for (const [playerId, score] of Object.entries(ranked)) {
      state.roundScores[playerId] = (state.roundScores[playerId] ?? 0) + score.points;
      state.roundScores[artistId] = (state.roundScores[artistId] ?? 0) + 250;
    }
  }
}

export function onDrawAction(
  state: DrawState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): DrawState {
  state.playerIds = [...ctx.playerIds];
  const artistId = state.phase === "drawing" ? playerId : currentArtistId(state);

  if (action.kind === "draw_tool" && state.phase === "drawing") {
    const d = state.drawings[playerId];
    if (!d) return state;
    d.tool = action.tool;
    if (action.width !== undefined) d.width = Math.max(2, Math.min(16, action.width));
  }
  if (action.kind === "draw_stroke" && state.phase === "drawing") {
    const d = state.drawings[playerId];
    if (!d) return state;
    applyStrokeToDrawing(d, action);
  }
  if (action.kind === "draw_undo" && state.phase === "drawing") {
    const d = state.drawings[playerId];
    if (d) undoDrawingStrokes(d);
  }
  if (action.kind === "draw_clear" && state.phase === "drawing") {
    const d = state.drawings[playerId];
    if (d) clearDrawingStrokes(d);
  }
  if (action.kind === "submit_text" && state.phase === "guessing" && playerId !== artistId) {
    if (state.guesses[playerId] === undefined) {
      state.guesses[playerId] = action.text.slice(0, 60);
      state.guessTimes[playerId] = Date.now();
    }
    const guessers = ctx.playerIds.filter((id) => id !== artistId);
    if (guessers.every((id) => state.guesses[id] !== undefined)) {
      return advanceDraw(state, state.wordsPool, ctx.playerIds);
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceDraw(state, state.wordsPool, ctx.playerIds);
  }
  if (action.kind === "advance" && state.phase === "drawing") {
    if (playerId === "host") {
      return advanceDraw(state, state.wordsPool, ctx.playerIds);
    }
    state.ready[playerId] = true;
    if (allDrawersReady(state.ready, ctx.playerIds)) {
      return advanceDraw(state, state.wordsPool, ctx.playerIds);
    }
    return state;
  }
  if (action.kind === "advance" && playerId === "host" && state.phase === "guessing") {
    scoreCurrentDrawing(state, ctx.playerIds, state.gameOptions);
    state.phase = "reveal";
    Object.assign(state, startPhaseTimer(REVEAL_MS, state.gameOptions));
    return state;
  }
  return state;
}

export function onDrawTick(state: DrawState, words?: string[], playerIds?: string[]): DrawState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceDraw(state, words ?? state.wordsPool, playerIds ?? state.playerIds);
}

export function drawHostView(state: DrawState, playerIds: string[]) {
  const artistId = currentArtistId(state);
  const drawing = currentDrawing(state);
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  const displayStrokes = state.phase === "drawing"
    ? undefined
    : drawing?.strokes;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      drawerId: artistId,
      simultaneousDraw: state.phase === "drawing",
      drawingCount: state.phase === "drawing" ? Object.keys(state.drawings).length : undefined,
      word: showReveal && drawing ? drawing.word : undefined,
      strokes: displayStrokes,
      allDrawings: showReveal
        ? state.guessOrder.map((id) => ({
            playerId: id,
            word: state.drawings[id]?.word,
            strokes: state.drawings[id]?.strokes ?? [],
          }))
        : undefined,
      correctGuessers: state.correctGuessers,
      playerAnswers: showReveal
        ? Object.entries(state.guesses).map(([pid, guess]) => ({
            playerId: pid,
            answer: guess,
            correct: state.correctGuessers.includes(pid),
          }))
        : undefined,
      roundScores: state.phase === "ended" ? state.cumulativeScores : state.roundScores,
      guessProgress: state.phase === "guessing"
        ? { current: state.drawerIndex + 1, total: state.guessOrder.length }
        : undefined,
    },
  };
}

export function drawPlayerView(state: DrawState, playerId: string, playerIds: string[]) {
  const artistId = currentArtistId(state);
  const myDrawing = state.drawings[playerId];
  const isArtist = state.phase === "guessing" ? playerId === artistId : true;
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  const viewingDrawing = state.phase === "guessing" ? currentDrawing(state) : myDrawing;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      isDrawer: state.phase === "drawing" || (state.phase === "guessing" && playerId === artistId),
      simultaneousDraw: state.phase === "drawing",
      strokes: state.phase === "drawing" ? myDrawing?.strokes : viewingDrawing?.strokes,
      drawerId: state.phase === "guessing" ? artistId ?? undefined : undefined,
      word: showReveal && viewingDrawing ? viewingDrawing.word : undefined,
      playerAnswers: showReveal
        ? Object.entries(state.guesses).map(([pid, guess]) => ({
            playerId: pid,
            answer: guess,
            correct: state.correctGuessers.includes(pid),
          }))
        : undefined,
    },
    playerData: {
      isDrawer: state.phase === "drawing" || (state.phase === "guessing" && playerId === artistId),
      drawerId: state.phase === "guessing" && playerId !== artistId ? artistId : undefined,
      word:
        state.phase === "drawing"
          ? myDrawing?.word
          : state.phase === "guessing" && playerId === artistId
            ? myDrawing?.word
            : showReveal
              ? viewingDrawing?.word
              : undefined,
      guessed: state.guesses[playerId] !== undefined,
      myGuess: state.guesses[playerId],
      tool: myDrawing?.tool,
      brushWidth: myDrawing?.width,
      drawingReady: state.ready[playerId] === true,
      drawingRevision: myDrawing?.revision ?? 0,
    },
  };
}
