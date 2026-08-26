import type { GameModule } from "@party-games/shared";
import { timelinePool } from "../content-pool.js";
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
    description: "Guess when famous events happened",
    scoringRules: "Up to +1000 by accuracy; pts deducted per year off is configurable.",
    minPlayers: 2,
    maxPlayers: 16,
    category: "trivia",
    supportsDifficulty: true,
    supportsMatureContent: false,
    supportsSpeedScoring: true,
    supportsQuestionDisplay: true,
    supportsTimelinePtsPerYear: true,
  },
  init(ctx) {
    const state = createTriviaState("timeline", timelinePool(ctx.gameOptions), 8, ctx.playerIds.length);
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
