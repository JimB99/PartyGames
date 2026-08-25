import type { GameModule } from "@party-games/shared";
import { content } from "../content.js";
import {
  createTriviaState,
  onTriviaAction,
  onTriviaTick,
  triviaHostView,
  triviaPlayerView,
} from "../engines/trivia-engine.js";

import type { TriviaState } from "../engines/trivia-engine.js";

export const wouldYouRatherGame: GameModule<TriviaState> = {
  meta: {
    id: "would-you-rather",
    name: "Would You Rather",
    description: "Pick a side and see the split",
    minPlayers: 2,
    maxPlayers: 16,
    category: "social",
  },
  init() {
    return createTriviaState("would-you-rather", content.wouldYouRather, 10);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onTriviaAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onTriviaAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onTriviaTick(state, content.wouldYouRather);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return triviaHostView(state);
  },
  getPlayerView(state, playerId) {
    return triviaPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
