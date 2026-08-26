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

export const timelineGame: GameModule<TriviaState> = {
  meta: {
    id: "timeline",
    name: "When Was It",
    description: "Guess when things happened",
    scoringRules: "Up to +1000 based on how close your year guess is (lose 20 per year off).",
    minPlayers: 2,
    maxPlayers: 16,
    category: "trivia",
  },
  init() {
    return createTriviaState("timeline", content.timeline, 8);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onTriviaAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onTriviaAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onTriviaTick(state, content.timeline);
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
