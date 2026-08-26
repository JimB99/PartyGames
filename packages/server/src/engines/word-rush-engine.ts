import { pickRandom, shuffle, type GameAction, type RoomContext } from "@party-games/shared";

export type WordRushPhase = "instructions" | "playing" | "reveal" | "scoreboard" | "ended";

export interface WordRushState {
  phase: WordRushPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  letters: string[];
  submissions: Record<string, string>;
  validWords: Record<string, boolean>;
  roundScores: Record<string, number>;
}

const PLAY_MS = 60000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 4000;

export function createWordRushState(maxRounds = 3): WordRushState {
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    letters: generateLetters(),
    submissions: {},
    validWords: {},
    roundScores: {},
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
    state.timerEndsAt = Date.now() + PLAY_MS;
    state.submissions = {};
    state.validWords = {};
    return state;
  }
  if (state.phase === "playing") {
    scoreWordRush(state);
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
    state.letters = generateLetters();
    state.phase = "instructions";
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

export function scoreWordRush(state: WordRushState, dictionary?: Set<string>) {
  state.roundScores = {};
  const seen = new Set<string>();
  for (const [playerId, word] of Object.entries(state.submissions)) {
    const w = word.toLowerCase().trim();
    const valid = w.length >= 3 && canFormWord(w, state.letters) && (dictionary?.has(w) ?? w.length >= 3);
    state.validWords[playerId] = valid && !seen.has(w);
    if (state.validWords[playerId]) {
      seen.add(w);
      state.roundScores[playerId] = w.length * 100;
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
    state.submissions[playerId] = action.text.slice(0, 40);
    if (Object.keys(state.submissions).length >= ctx.playerIds.length) {
      return advanceWordRush(state);
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceWordRush(state);
  }
  return state;
}

export function onWordRushTick(state: WordRushState, dictionary?: Set<string>): WordRushState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  if (state.phase === "playing") {
    scoreWordRush(state, dictionary);
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
    data: {
      letters: state.letters,
      submissions: showReveal
        ? Object.entries(state.submissions).map(([playerId, word]) => ({
            playerId,
            word,
            valid: state.validWords[playerId],
          }))
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
