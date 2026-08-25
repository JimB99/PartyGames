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

export const quickQuizGame: GameModule<TriviaState> = {
  meta: {
    id: "quick-quiz",
    name: "Quick Quiz",
    description: "Multiple-choice trivia on the big screen",
    minPlayers: 1,
    maxPlayers: 16,
    category: "trivia",
  },
  init() {
    return createTriviaState("quiz", content.quiz);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onTriviaAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onTriviaAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onTriviaTick(state, content.quiz);
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
