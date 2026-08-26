import type { GameModule } from "@party-games/shared";
import { quizPool } from "../content-pool.js";
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
    scoringRules: "+1000 for correct; speed scoring ranks correct answers by % of lobby size.",
    minPlayers: 1,
    maxPlayers: 16,
    category: "trivia",
    supportsDifficulty: true,
    supportsMatureContent: true,
    supportsSpeedScoring: true,
    supportsQuestionDisplay: true,
  },
  init(ctx) {
    const state = createTriviaState("quiz", quizPool(ctx.gameOptions), 8, ctx.playerIds.length);
    state.gameOptions = ctx.gameOptions;
    return state;
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onTriviaAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onTriviaAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onTriviaTick(state, state.itemsPool, state.gameOptions);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return triviaHostView(state, state.gameOptions);
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
