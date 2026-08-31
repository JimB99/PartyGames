import { pickRandom, type GameModule } from "@party-games/shared";
import { charadesWordPool } from "../content-pool.js";

export type CharadesPhase = "instructions" | "acting" | "reveal" | "scoreboard" | "ended";

export interface CharadesState {
  phase: CharadesPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  playerIds: string[];
  actorIndex: number;
  word: string;
  correct: number;
  skipped: number;
  roundScores: Record<string, number>;
  usedWords: string[];
  wordsPool: string[];
}

const ACT_MS = 60000;
const REVEAL_MS = 5000;

function pickCharadesWord(state: CharadesState): string {
  const available = state.wordsPool.filter((w) => !state.usedWords.includes(w));
  const word = available.length > 0 ? pickRandom(available) : pickRandom(state.wordsPool);
  state.usedWords.push(word);
  return word;
}

export const teamCharadesGame: GameModule<CharadesState> = {
  meta: {
    id: "team-charades",
    name: "Team Charades",
    description: "Act out words while your team guesses",
    scoringRules: "+500 for each word the actor marks as correctly guessed.",
    minPlayers: 3,
    maxPlayers: 12,
    category: "party",
    supportsDifficulty: true,
    supportsMatureContent: true,
  },
  init(ctx) {
    const wordsPool = charadesWordPool(ctx.gameOptions);
    const word = pickRandom(wordsPool);
    return {
      phase: "instructions",
      round: 1,
      maxRounds: ctx.playerIds.length,
      timerEndsAt: Date.now() + 5000,
      playerIds: ctx.playerIds,
      actorIndex: 0,
      word,
      correct: 0,
      skipped: 0,
      roundScores: {},
      usedWords: [word],
      wordsPool,
    };
  },
  onPlayerAction(state, playerId, action, ctx) {
    const actorId = ctx.playerIds[state.actorIndex];
    if (playerId !== actorId) return state;
    if (action.kind === "charades_correct" && state.phase === "acting") {
      state.correct += 1;
      state.roundScores[playerId] = (state.roundScores[playerId] ?? 0) + 500;
      state.word = pickCharadesWord(state);
    }
    if (action.kind === "charades_skip" && state.phase === "acting") {
      state.skipped += 1;
      state.word = pickCharadesWord(state);
    }
    return state;
  },
  onHostAction(state, action, ctx) {
    if (action.kind === "advance" && state.phase === "instructions") {
      state.phase = "acting";
      state.timerEndsAt = Date.now() + ACT_MS;
    }
    if (action.kind === "advance" && state.phase === "reveal") {
      if (state.round >= state.maxRounds) {
        state.phase = "ended";
        state.timerEndsAt = null;
      } else {
        state.round += 1;
        state.actorIndex = (state.actorIndex + 1) % ctx.playerIds.length;
        state.word = pickCharadesWord(state);
        state.correct = 0;
        state.skipped = 0;
        state.phase = "instructions";
        state.timerEndsAt = Date.now() + 5000;
      }
    }
    return state;
  },
  onTick(state) {
    if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
    if (state.phase === "acting") {
      state.phase = "reveal";
      state.timerEndsAt = Date.now() + REVEAL_MS;
    } else if (state.phase === "instructions") {
      state.phase = "acting";
      state.timerEndsAt = Date.now() + ACT_MS;
    } else if (state.phase === "reveal") {
      if (state.round >= state.maxRounds) {
        state.phase = "ended";
        state.timerEndsAt = null;
      } else {
        state.round += 1;
        state.actorIndex = (state.actorIndex + 1) % state.playerIds.length;
        state.word = pickCharadesWord(state);
        state.correct = 0;
        state.skipped = 0;
        state.phase = "instructions";
        state.timerEndsAt = Date.now() + 5000;
      }
    }
    return state;
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, ctx) {
    const actorId = ctx.playerIds[state.actorIndex];
    return {
      phase: state.phase,
      round: state.round,
      maxRounds: state.maxRounds,
      timerEndsAt: state.timerEndsAt,
      data: {
        actorId,
        word: state.phase === "reveal" ? state.word : undefined,
        correct: state.correct,
        skipped: state.skipped,
        roundScores: state.roundScores,
      },
    };
  },
  getPlayerView(state, playerId, ctx) {
    const actorId = ctx.playerIds[state.actorIndex];
    const isActor = playerId === actorId;
    return {
      phase: state.phase,
      round: state.round,
      maxRounds: state.maxRounds,
      timerEndsAt: state.timerEndsAt,
      data: {
        isActor,
        actorId,
      },
      playerData: {
        word: isActor && state.phase === "acting" ? state.word : undefined,
      },
    };
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
