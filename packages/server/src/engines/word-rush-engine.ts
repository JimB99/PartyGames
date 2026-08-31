import { pickRandom, shuffle, isSpeedScoringEnabled, scoreByAnswerRank, type GameAction, type GameOptions, type RoomContext } from "@party-games/shared";

export type WordRushPhase = "instructions" | "playing" | "reveal" | "scoreboard" | "ended";

export interface WordRushState {
  phase: WordRushPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  letters: string[];
  submissions: Record<string, string>;
  submissionTimes: Record<string, number>;
  playPhaseStartedAt: number | null;
  validWords: Record<string, boolean>;
  roundScores: Record<string, number>;
  dictionary: Set<string>;
  minWordLength: number;
  gameOptions?: GameOptions;
  playerCount: number;
}

const PLAY_MS = 60000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 4000;

export function createWordRushState(
  maxRounds = 3,
  dictionary?: Set<string>,
  minWordLength = 3,
  playerCount = 2,
): WordRushState {
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    timerTotalMs: 5000,
    letters: generateLetters(),
    submissions: {},
    submissionTimes: {},
    playPhaseStartedAt: null,
    validWords: {},
    roundScores: {},
    dictionary: dictionary ?? new Set(),
    minWordLength,
    playerCount,
  };
}

function generateLetters(): string[] {
  const vowels = ["A", "E", "I", "O", "U"];
  const consonants = shuffle(["R", "S", "T", "N", "L", "D", "G", "B", "C", "M", "P", "F", "H", "V", "W", "Y"]);
  return shuffle([...vowels.slice(0, 2), ...consonants.slice(0, 5)]);
}

export function advanceWordRush(state: WordRushState): WordRushState {
  if (state.phase === "instructions") {
    state.phase = "playing";
    state.playPhaseStartedAt = Date.now();
    state.timerTotalMs = PLAY_MS;
    state.timerEndsAt = state.playPhaseStartedAt + PLAY_MS;
    state.submissions = {};
    state.submissionTimes = {};
    state.validWords = {};
    return state;
  }
  if (state.phase === "playing") {
    scoreWordRush(state, state.gameOptions);
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
    state.letters = generateLetters();
    state.phase = "instructions";
    state.timerTotalMs = 5000;
    state.timerEndsAt = Date.now() + 5000;
    return state;
  }
  return state;
}

function canFormWord(word: string, letters: string[]): boolean {
  const available = [...letters.map((l) => l.toLowerCase())];
  for (const char of word.toLowerCase()) {
    const idx = available.indexOf(char);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

export function scoreWordRush(state: WordRushState, gameOptions?: GameOptions) {
  state.roundScores = {};
  const seen = new Set<string>();
  const speedOn = gameOptions ? isSpeedScoringEnabled(gameOptions) : false;
  const totalPlayers = Math.max(1, state.playerCount);
  const validEntries: Array<{ playerId: string; answeredAt: number }> = [];

  for (const [playerId, word] of Object.entries(state.submissions)) {
    const w = word.toLowerCase().trim();
    const inDictionary = state.dictionary.size === 0 || state.dictionary.has(w);
    const valid = w.length >= state.minWordLength && canFormWord(w, state.letters) && inDictionary;
    state.validWords[playerId] = valid && !seen.has(w);
    if (state.validWords[playerId]) {
      seen.add(w);
      if (speedOn && state.submissionTimes[playerId] !== undefined) {
        validEntries.push({ playerId, answeredAt: state.submissionTimes[playerId] });
      } else if (!speedOn) {
        state.roundScores[playerId] = w.length * 100;
      }
    }
  }

  if (speedOn && validEntries.length > 0) {
    const ranked = scoreByAnswerRank(validEntries, totalPlayers, 1);
    for (const [playerId, score] of Object.entries(ranked)) {
      state.roundScores[playerId] = score.points;
    }
  }
}

export function onWordRushAction(
  state: WordRushState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): WordRushState {
  if (action.kind === "submit_text" && state.phase === "playing") {
    if (state.submissions[playerId] === undefined) {
      state.submissions[playerId] = action.text.slice(0, 40);
      state.submissionTimes[playerId] = Date.now();
    }
    if (Object.keys(state.submissions).length >= ctx.playerIds.length) {
      return advanceWordRush(state);
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceWordRush(state);
  }
  return state;
}

export function onWordRushTick(state: WordRushState): WordRushState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  if (state.phase === "playing") {
    scoreWordRush(state, state.gameOptions);
  }
  return advanceWordRush(state);
}

export function wordRushHostView(state: WordRushState) {
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      letters: state.phase !== "instructions" ? state.letters : undefined,
      submissions: showReveal
        ? Object.entries(state.submissions).map(([playerId, word]) => ({
            playerId,
            word,
            valid: state.validWords[playerId],
          }))
        : state.phase === "playing"
          ? Object.keys(state.submissions).map((playerId) => ({ playerId, word: "…", valid: true }))
          : undefined,
      playerAnswers: showReveal
        ? Object.entries(state.submissions).map(([playerId, word]) => ({
            playerId,
            answer: word,
            detail: state.validWords[playerId] ? "Valid" : "Invalid",
            correct: state.validWords[playerId],
          }))
        : undefined,
      roundScores: state.roundScores,
      submitCount: Object.keys(state.submissions).length,
    },
  };
}

export function wordRushPlayerView(state: WordRushState, playerId: string) {
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      letters: state.phase !== "instructions" ? state.letters : undefined,
      playerAnswers: showReveal
        ? Object.entries(state.submissions).map(([pid, word]) => ({
            playerId: pid,
            answer: word,
            detail: state.validWords[pid] ? "Valid" : "Invalid",
            correct: state.validWords[pid],
          }))
        : undefined,
    },
    playerData: {
      submitted: state.submissions[playerId] !== undefined,
      myWord: state.submissions[playerId],
      valid: state.validWords[playerId],
    },
  };
}
