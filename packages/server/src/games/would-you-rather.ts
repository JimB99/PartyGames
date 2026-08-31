import type { GameModule } from "@party-games/shared";
import { wouldYouRatherPool } from "../content-pool.js";
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
    description: "Pick between two awkward options",
    scoringRules: "No points — see how the group splits on each dilemma.",
    minPlayers: 2,
    maxPlayers: 16,
    category: "social",
    supportsDifficulty: true,
    supportsMatureContent: true,
    supportsSpeedScoring: false,
    supportsQuestionDisplay: true,
  },
  init(ctx) {
    const state = createTriviaState("would-you-rather", wouldYouRatherPool(ctx.gameOptions), 10, ctx.playerIds.length);
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
