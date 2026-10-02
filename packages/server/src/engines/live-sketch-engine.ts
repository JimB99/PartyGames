import {
  TIMER_PRESETS,
  beginTimedPhase,
  isAllowedCustomLiveSketchWord,
  isLiveSketchHangmanLetter,
  isSpeedScoringEnabled,
  liveSketchGuessMatches,
  liveSketchLetterCount,
  liveSketchMask,
  liveSketchMaskComplete,
  liveSketchNextPlayPhase,
  liveSketchPhaseDurationMs,
  liveSketchWordCount,
  LIVE_SKETCH_DRAWER_CAP,
  LIVE_SKETCH_DRAWER_PTS,
  LIVE_SKETCH_FLAT_GUESS_PTS,
  LIVE_SKETCH_LETTER_COOLDOWN_MS,
  LIVE_SKETCH_PICK_MS,
  pickRandom,
  pruneKeyed,
  resolveLiveSketchSchedule,
  resolveLiveSketchWordSource,
  scoreByAnswerRank,
  shuffle,
  type GameAction,
  type GameOptions,
  type LiveSketchPhase,
  type LiveSketchSchedule,
  type RoomContext,
} from "@party-games/shared";
import {
  applyStrokeToDrawing,
  clearDrawingStrokes,
  undoDrawingStrokes,
  type PlayerDrawing,
  type Stroke,
} from "./drawing-engine.js";

export interface LiveSketchState {
  phase: LiveSketchPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  playerIds: string[];
  drawerIndex: number;
  word: string;
  choiceWords: string[];
  strokes: Stroke[];
  tool: "pen" | "eraser";
  width: number;
  revision: number;
  guessedLetters: string[];
  missedLetters: string[];
  lastLetterAt: Record<string, number>;
  correctAt: Record<string, number>;
  lastGuess: Record<string, string>;
  roundScores: Record<string, number>;
  cumulativeScores: Record<string, number>;
  usedWords: string[];
  wordsPool: string[];
  gameOptions?: GameOptions;
}

const INSTRUCTIONS_MS = TIMER_PRESETS.standard.instruction;
const REVEAL_MS = TIMER_PRESETS.standard.reveal;
const SCOREBOARD_MS = TIMER_PRESETS.standard.roundBreak;

function scheduleOf(state: LiveSketchState): LiveSketchSchedule {
  return resolveLiveSketchSchedule(state.gameOptions);
}

function drawerId(state: LiveSketchState): string {
  return state.playerIds[state.drawerIndex] ?? state.playerIds[0] ?? "";
}

function guesserIds(state: LiveSketchState): string[] {
  const id = drawerId(state);
  return state.playerIds.filter((p) => p !== id);
}

function boardOf(state: LiveSketchState): PlayerDrawing {
  return {
    playerId: drawerId(state),
    word: state.word,
    strokes: state.strokes,
    tool: state.tool,
    width: state.width,
    revision: state.revision,
  };
}

function saveBoard(state: LiveSketchState, board: PlayerDrawing): void {
  state.strokes = board.strokes;
  state.tool = board.tool;
  state.width = board.width;
  state.revision = board.revision;
}

function setTimer(state: LiveSketchState, phase: LiveSketchPhase, durationMs: number): void {
  Object.assign(state, beginTimedPhase(state, phase, Date.now(), durationMs, state.gameOptions));
}

function unusedPool(state: LiveSketchState): string[] {
  const unused = state.wordsPool.filter((w) => !state.usedWords.includes(w));
  return unused.length > 0 ? unused : [...state.wordsPool];
}

function pickPoolWord(state: LiveSketchState): string {
  const word = pickRandom(unusedPool(state));
  if (!state.usedWords.includes(word)) state.usedWords.push(word);
  return word;
}

function resetCanvas(state: LiveSketchState): void {
  state.strokes = [];
  state.tool = "pen";
  state.width = 4;
  state.revision = 0;
  state.guessedLetters = [];
  state.missedLetters = [];
  state.lastLetterAt = {};
  state.correctAt = {};
  state.lastGuess = {};
  state.roundScores = {};
}

function enterDrawing(state: LiveSketchState, word: string): void {
  state.word = word;
  resetCanvas(state);
  setTimer(state, "drawing", liveSketchPhaseDurationMs("drawing", scheduleOf(state)));
}

function enterPick(state: LiveSketchState): void {
  const unique = [...new Set(shuffle(unusedPool(state)))];
  state.choiceWords = unique.slice(0, 3);
  state.word = "";
  setTimer(state, "pick", LIVE_SKETCH_PICK_MS);
}

function scoreRound(state: LiveSketchState): void {
  state.roundScores = {};
  const guessers = guesserIds(state);
  const correct = guessers
    .filter((id) => state.correctAt[id] !== undefined)
    .map((id) => ({ playerId: id, answeredAt: state.correctAt[id]! }));
  if (correct.length === 0) return;

  const speedOn = state.gameOptions ? isSpeedScoringEnabled(state.gameOptions) : true;
  if (speedOn) {
    const ranked = scoreByAnswerRank(correct, Math.max(1, guessers.length), 1);
    for (const [id, score] of Object.entries(ranked)) {
      state.roundScores[id] = score.points;
    }
  } else {
    for (const entry of correct) {
      state.roundScores[entry.playerId] = LIVE_SKETCH_FLAT_GUESS_PTS;
    }
  }
  const drawer = drawerId(state);
  state.roundScores[drawer] = Math.min(LIVE_SKETCH_DRAWER_CAP, LIVE_SKETCH_DRAWER_PTS * correct.length);
}

function enterReveal(state: LiveSketchState): void {
  scoreRound(state);
  setTimer(state, "reveal", REVEAL_MS);
}

function allGuessersCorrect(state: LiveSketchState): boolean {
  const guessers = guesserIds(state);
  return guessers.length > 0 && guessers.every((id) => state.correctAt[id] !== undefined);
}

function advancePlay(state: LiveSketchState): LiveSketchState {
  const next = liveSketchNextPlayPhase(state.phase, scheduleOf(state));
  if (next === "letter-count") {
    setTimer(state, "letter-count", liveSketchPhaseDurationMs("letter-count", scheduleOf(state)));
    return state;
  }
  if (next === "hangman") {
    setTimer(state, "hangman", liveSketchPhaseDurationMs("hangman", scheduleOf(state)));
    return state;
  }
  enterReveal(state);
  return state;
}

function beginRound(state: LiveSketchState): LiveSketchState {
  resetCanvas(state);
  if (resolveLiveSketchWordSource(state.gameOptions) === "choice") {
    enterPick(state);
    return state;
  }
  enterDrawing(state, pickPoolWord(state));
  return state;
}

export function createLiveSketchState(
  words: string[],
  playerIds: string[],
  gameOptions?: GameOptions,
): LiveSketchState {
  const pool = words.length > 0 ? [...words] : ["sketch"];
  const state: LiveSketchState = {
    phase: "instructions",
    round: 1,
    maxRounds: Math.max(1, playerIds.length),
    timerEndsAt: null,
    timerTotalMs: null,
    playerIds: [...playerIds],
    drawerIndex: 0,
    word: "",
    choiceWords: [],
    strokes: [],
    tool: "pen",
    width: 4,
    revision: 0,
    guessedLetters: [],
    missedLetters: [],
    lastLetterAt: {},
    correctAt: {},
    lastGuess: {},
    roundScores: {},
    cumulativeScores: {},
    usedWords: [],
    wordsPool: pool,
    gameOptions,
  };
  setTimer(state, "instructions", INSTRUCTIONS_MS);
  return state;
}

function playing(state: LiveSketchState): boolean {
  return state.phase === "drawing" || state.phase === "letter-count" || state.phase === "hangman";
}

function applyGuess(state: LiveSketchState, playerId: string, text: string): LiveSketchState {
  if (!playing(state)) return state;
  if (playerId === drawerId(state)) return state;
  if (state.correctAt[playerId] !== undefined) return state;
  state.lastGuess[playerId] = text;
  if (!liveSketchGuessMatches(text, state.word)) return state;
  state.correctAt[playerId] = Date.now();
  if (allGuessersCorrect(state)) enterReveal(state);
  return state;
}

function applyLetter(state: LiveSketchState, playerId: string, letter: string): LiveSketchState {
  if (state.phase !== "hangman") return state;
  if (playerId === drawerId(state)) return state;
  if (state.correctAt[playerId] !== undefined) return state;
  const n = letter.trim().toLowerCase();
  if (!isLiveSketchHangmanLetter(n)) return state;
  if (state.guessedLetters.includes(n) || state.missedLetters.includes(n)) return state;
  const now = Date.now();
  const last = state.lastLetterAt[playerId];
  if (last !== undefined && now - last < LIVE_SKETCH_LETTER_COOLDOWN_MS) return state;
  state.lastLetterAt[playerId] = now;
  const inWord = state.word.toLowerCase().includes(n);
  if (inWord) state.guessedLetters.push(n);
  else state.missedLetters.push(n);
  if (liveSketchMaskComplete(state.word, state.guessedLetters)) {
    enterReveal(state);
  }
  return state;
}

export function advanceLiveSketch(state: LiveSketchState): LiveSketchState {
  if (state.phase === "ended") return state;
  if (state.phase === "instructions") return beginRound(state);
  if (state.phase === "pick") {
    const word = state.choiceWords[0] ?? pickPoolWord(state);
    if (!state.usedWords.includes(word)) state.usedWords.push(word);
    enterDrawing(state, word);
    return state;
  }
  if (playing(state)) return advancePlay(state);
  if (state.phase === "reveal") {
    setTimer(state, "scoreboard", SCOREBOARD_MS);
    return state;
  }
  if (state.phase === "scoreboard") {
    for (const [id, pts] of Object.entries(state.roundScores)) {
      state.cumulativeScores[id] = (state.cumulativeScores[id] ?? 0) + pts;
    }
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.roundScores = { ...state.cumulativeScores };
      state.timerEndsAt = null;
      state.timerTotalMs = null;
      return state;
    }
    state.round += 1;
    state.drawerIndex = (state.drawerIndex + 1) % Math.max(1, state.playerIds.length);
    state.roundScores = {};
    setTimer(state, "instructions", INSTRUCTIONS_MS);
    return state;
  }
  return state;
}

export function onLiveSketchRosterChange(
  state: LiveSketchState,
  ctx: RoomContext,
): LiveSketchState {
  const ids = [...ctx.playerIds];
  if (ids.length === 0) return state;

  const previousDrawer = drawerId(state);
  const drawerPresent = ids.includes(previousDrawer);

  // No artist left for this round — close it out now instead of waiting on the timer.
  // Scoring runs before the roster swap so the departed drawer is still the artist.
  if (!drawerPresent && (playing(state) || state.phase === "pick")) {
    enterReveal(state);
  }

  state.playerIds = ids;
  state.maxRounds = Math.max(1, ids.length);
  const sameDrawer = ids.indexOf(previousDrawer);
  state.drawerIndex = sameDrawer >= 0 ? sameDrawer : Math.min(state.drawerIndex, ids.length - 1);

  state.correctAt = pruneKeyed(state.correctAt, ids);
  state.lastGuess = pruneKeyed(state.lastGuess, ids);
  state.lastLetterAt = pruneKeyed(state.lastLetterAt, ids);

  if (playing(state) && allGuessersCorrect(state)) enterReveal(state);
  return state;
}

export function onLiveSketchAction(
  state: LiveSketchState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): LiveSketchState {
  state.playerIds = [...ctx.playerIds];
  if (state.drawerIndex >= state.playerIds.length) state.drawerIndex = 0;

  if (action.kind === "advance" && playerId === "host") {
    return advanceLiveSketch(state);
  }

  if (state.phase === "pick" && playerId === drawerId(state)) {
    if (action.kind === "vote" && state.choiceWords.includes(action.optionId)) {
      if (!state.usedWords.includes(action.optionId)) state.usedWords.push(action.optionId);
      enterDrawing(state, action.optionId);
      return state;
    }
    if (action.kind === "submit_text") {
      const custom = action.text.trim();
      if (!isAllowedCustomLiveSketchWord(custom)) return state;
      enterDrawing(state, custom);
      return state;
    }
  }

  if (action.kind === "submit_text") {
    return applyGuess(state, playerId, action.text);
  }
  if (action.kind === "hangman_letter") {
    return applyLetter(state, playerId, action.letter);
  }

  if (playing(state) && playerId === drawerId(state)) {
    const board = boardOf(state);
    if (action.kind === "draw_tool") {
      board.tool = action.tool;
      if (action.width !== undefined) board.width = Math.max(2, Math.min(16, action.width));
      saveBoard(state, board);
    }
    if (action.kind === "draw_stroke") {
      applyStrokeToDrawing(board, action);
      saveBoard(state, board);
    }
    if (action.kind === "draw_undo") {
      undoDrawingStrokes(board);
      saveBoard(state, board);
    }
    if (action.kind === "draw_clear") {
      clearDrawingStrokes(board);
      saveBoard(state, board);
    }
  }

  return state;
}

export function onLiveSketchTick(state: LiveSketchState): LiveSketchState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  if (state.gameOptions?.hostPacing) return state;
  return advanceLiveSketch(state);
}

function showWord(state: LiveSketchState): boolean {
  return state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended";
}

function hintFields(state: LiveSketchState) {
  const letterOn = state.phase === "letter-count" || state.phase === "hangman" || showWord(state);
  const hangOn = state.phase === "hangman" || showWord(state);
  return {
    letterCount: letterOn && state.word ? liveSketchLetterCount(state.word) : undefined,
    wordCount: letterOn && state.word ? liveSketchWordCount(state.word) : undefined,
    mask: hangOn && state.word ? liveSketchMask(state.word, state.guessedLetters) : undefined,
    missedLetters: hangOn ? [...state.missedLetters] : undefined,
    guessedLetters: hangOn ? [...state.guessedLetters] : undefined,
  };
}

export function liveSketchHostView(state: LiveSketchState, _ctx?: RoomContext) {
  const artist = drawerId(state);
  const guessers = guesserIds(state);
  const correctIds = guessers.filter((id) => state.correctAt[id] !== undefined);
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      drawerId: artist,
      strokes: playing(state) || showWord(state) ? state.strokes : undefined,
      correctIds,
      remainingGuessers: guessers.length - correctIds.length,
      word: showWord(state) ? state.word : undefined,
      playerAnswers: showWord(state)
        ? guessers.map((pid) => ({
            playerId: pid,
            correct: state.correctAt[pid] !== undefined,
          }))
        : undefined,
      roundScores: state.phase === "ended" ? state.cumulativeScores : state.roundScores,
      choiceCount: state.phase === "pick" ? state.choiceWords.length : undefined,
      hintMarks: [scheduleOf(state).letterAt, scheduleOf(state).hangmanAt].filter(
        (n): n is number => n !== null,
      ),
      ...hintFields(state),
    },
  };
}

export function liveSketchPlayerView(state: LiveSketchState, playerId: string, _ctx?: RoomContext) {
  const artist = drawerId(state);
  const isDrawer = playerId === artist;
  const guessed = state.correctAt[playerId] !== undefined;
  const host = liveSketchHostView(state);
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      ...host.data,
      word: showWord(state) ? state.word : undefined,
    },
    playerData: {
      isDrawer,
      drawerId: artist,
      word: isDrawer || showWord(state) ? state.word || undefined : undefined,
      guessed,
      lastWrong: Boolean(state.lastGuess[playerId] && !guessed),
      choiceWords: state.phase === "pick" && isDrawer ? state.choiceWords : undefined,
      canGuessLetters: state.phase === "hangman" && !isDrawer && !guessed,
      tool: isDrawer ? state.tool : undefined,
      brushWidth: isDrawer ? state.width : undefined,
      drawingRevision: state.revision,
    },
  };
}

export function liveSketchRoundScores(state: LiveSketchState): Record<string, number> {
  return state.roundScores;
}

export function liveSketchIsGameOver(state: LiveSketchState): boolean {
  return state.phase === "ended";
}

export function liveSketchNeedsTick(state: LiveSketchState): boolean {
  return state.phase !== "ended";
}
