import type { GameModule } from "@party-games/shared";
import { content } from "../content.js";
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
    minPlayers: 2,
    maxPlayers: 16,
    category: "action",
  },
  init() {
    return createWordRushState();
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onWordRushAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onWordRushAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onWordRushTick(state, content.dictionary);
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
