import {
  applyHangmanLetter,
  createHangmanPlayerState,
  hangmanLost,
  hangmanMask,
  pickRandom,
  scoreByAnswerRank,
  tryHangmanSolve,
  type GameAction,
  type RoomContext,
} from "@party-games/shared";

export type HangmanRacePhase = "instructions" | "playing" | "reveal" | "scoreboard" | "ended";

interface PlayerHangman {
  guessed: string[];
  strikes: number;
  solved: boolean;
  solvedAt: number | null;
}

export interface HangmanRaceState {
  phase: HangmanRacePhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  word: string;
  players: Record<string, PlayerHangman>;
  roundScores: Record<string, number>;
  usedWords: string[];
  wordPool: string[];
  playerIds: string[];
  gameOptions?: import("@party-games/shared").GameOptions;
}

const PLAY_MS = 45_000;
const REVEAL_MS = 5000;
const SCOREBOARD_MS = 4000;

function pickWord(state: HangmanRaceState): string {
  const available = state.wordPool.filter((w) => !state.usedWords.includes(w));
  const word = available.length > 0 ? pickRandom(available) : pickRandom(state.wordPool);
  state.usedWords.push(word);
  return word;
}

export function createHangmanRaceState(
  words: string[],
  playerIds: string[],
  maxRounds = 4,
): HangmanRaceState {
  const word = pickRandom(words);
  const players: Record<string, PlayerHangman> = {};
  for (const id of playerIds) {
    const s = createHangmanPlayerState(word);
    players[id] = {
      guessed: [...s.guessed],
      strikes: s.strikes,
      solved: s.solved,
      solvedAt: s.solvedAt,
    };
  }
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    word,
    players,
    roundScores: {},
    usedWords: [word],
    wordPool: words,
    playerIds,
  };
}

function syncPlayer(state: HangmanRaceState, playerId: string): ReturnType<typeof createHangmanPlayerState> {
  const p = state.players[playerId];
  const base = createHangmanPlayerState(state.word);
  base.guessed = new Set(p.guessed);
  base.strikes = p.strikes;
  base.solved = p.solved;
  base.solvedAt = p.solvedAt;
  return base;
}

function savePlayer(state: HangmanRaceState, playerId: string, s: ReturnType<typeof createHangmanPlayerState>): void {
  state.players[playerId] = {
    guessed: [...s.guessed],
    strikes: s.strikes,
    solved: s.solved,
    solvedAt: s.solvedAt,
  };
}

function scoreRound(state: HangmanRaceState): void {
  const solved = state.playerIds
    .filter((id) => state.players[id]?.solved && state.players[id].solvedAt)
    .map((id) => ({ playerId: id, answeredAt: state.players[id].solvedAt! }));
  const ranked = scoreByAnswerRank(solved, state.playerIds.length, 1);
  state.roundScores = {};
  for (const [id, score] of Object.entries(ranked)) {
    state.roundScores[id] = score.points;
  }
}

function advanceHangman(state: HangmanRaceState): HangmanRaceState {
  if (state.phase === "instructions") {
    state.phase = "playing";
    state.timerEndsAt = Date.now() + PLAY_MS;
    return state;
  }
  if (state.phase === "playing") {
    scoreRound(state);
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
    state.word = pickWord(state);
    state.players = {};
    for (const id of state.playerIds) {
      const s = createHangmanPlayerState(state.word);
      state.players[id] = {
        guessed: [...s.guessed],
        strikes: s.strikes,
        solved: s.solved,
        solvedAt: s.solvedAt,
      };
    }
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
    return state;
  }
  return state;
}

export function onHangmanRaceAction(
  state: HangmanRaceState,
  playerId: string,
  action: GameAction,
  _ctx: RoomContext,
): HangmanRaceState {
  if (state.phase === "playing") {
    if (action.kind === "hangman_letter") {
      let s = syncPlayer(state, playerId);
      if (!s.solved && !hangmanLost(s)) {
        s = applyHangmanLetter(s, action.letter);
        savePlayer(state, playerId, s);
      }
      if (state.playerIds.every((id) => state.players[id]?.solved)) {
        return advanceHangman(state);
      }
      return state;
    }
    if (action.kind === "submit_text") {
      let s = syncPlayer(state, playerId);
      if (!s.solved && !hangmanLost(s)) {
        s = tryHangmanSolve(s, action.text);
        savePlayer(state, playerId, s);
      }
      return state;
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceHangman(state);
  }
  return state;
}

export function onHangmanRaceTick(state: HangmanRaceState): HangmanRaceState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceHangman(state);
}

export function hangmanRaceHostView(state: HangmanRaceState) {
  const showWord = state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended";
  const leaderboard = state.playerIds.map((id) => {
    const p = state.players[id];
    return {
      playerId: id,
      solved: p?.solved ?? false,
      strikes: p?.strikes ?? 0,
      mask: p ? hangmanMask(state.word, new Set(p.guessed)) : "",
    };
  });
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      word: showWord ? state.word : undefined,
      leaderboard,
      roundScores: state.roundScores,
    },
  };
}

export function hangmanRacePlayerView(state: HangmanRaceState, playerId: string) {
  const p = state.players[playerId];
  const guessed = new Set(p?.guessed ?? []);
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {},
    playerData: {
      mask: p ? hangmanMask(state.word, guessed) : "",
      strikes: p?.strikes ?? 0,
      solved: p?.solved ?? false,
      lost: p ? hangmanLost({ strikes: p.strikes }) && !p.solved : false,
    },
  };
}
