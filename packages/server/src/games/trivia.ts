import type { GameModule } from "@party-games/shared";
import { resolveTriviaFormat } from "@party-games/shared";
import { quizPool, timelinePool } from "../content-pool.js";
import {
  createTriviaState,
  onTriviaAction,
  onTriviaTick,
  triviaHostView,
  triviaPlayerView,
  type TriviaState,
} from "../engines/trivia-engine.js";

export const triviaGame: GameModule<TriviaState> = {
  meta: {
    id: "trivia",
    name: "Trivia",
    description: "Multiple-choice quiz or guess-the-year timeline",
    scoringRules: "+1000 for correct quiz answers; timeline accuracy up to +1000 by year.",
    minPlayers: 1,
    maxPlayers: 16,
    category: "trivia",
    supportsDifficulty: true,
    supportsMatureContent: true,
    supportsSpeedScoring: true,
    supportsQuestionDisplay: true,
    supportsTimelinePtsPerYear: true,
    supportsTriviaFormat: true,
    roundScoresAreCumulative: true,
  },
  init(ctx) {
    const format = resolveTriviaFormat(ctx.gameOptions);
    const pool = format === "timeline" ? timelinePool(ctx.gameOptions) : quizPool(ctx.gameOptions);
    const mode = format === "timeline" ? "timeline" : "quiz";
    return createTriviaState(mode, pool, 8, ctx.playerIds.length, ctx.gameOptions);
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
    const view = triviaHostView(state, state.gameOptions);
    return {
      ...view,
      data: { ...view.data, triviaFormat: state.mode === "timeline" ? "timeline" : "quiz" },
    };
  },
  getPlayerView(state, playerId) {
    const view = triviaPlayerView(state, playerId);
    return {
      ...view,
      data: { ...view.data, triviaFormat: state.mode === "timeline" ? "timeline" : "quiz" },
    };
  },
  getRoundScores(state) {
    return state.cumulativeScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
