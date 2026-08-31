import type { GameModule } from "@party-games/shared";
import { dictionaryForWordRush } from "../content-pool.js";
import {
  createWordRushState,
  onWordRushAction,
  onWordRushTick,
  wordRushHostView,
  wordRushPlayerView,
} from "../engines/word-rush-engine.js";

import type { WordRushState } from "../engines/word-rush-engine.js";

export const wordRushGame: GameModule<WordRushState> = {
  meta: {
    id: "word-rush",
    name: "Word Rush",
    description: "Race to type words from random letters",
    scoringRules: "Valid dictionary words from the tiles score points; with speed scoring on, fastest valid words rank higher.",
    minPlayers: 2,
    maxPlayers: 16,
    category: "arcade",
    supportsDifficulty: true,
    supportsMatureContent: false,
    supportsSpeedScoring: true,
  },
  init(ctx) {
    const dictionary = dictionaryForWordRush(ctx.gameOptions);
    const minWordLength =
      ctx.gameOptions.difficulty === "easy"
        ? 3
        : ctx.gameOptions.difficulty === "hard"
          ? 6
          : 4;
    const state = createWordRushState(3, dictionary, minWordLength, ctx.playerIds.length);
    state.gameOptions = ctx.gameOptions;
    return state;
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onWordRushAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onWordRushAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onWordRushTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return wordRushHostView(state);
  },
  getPlayerView(state, playerId) {
    return wordRushPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
