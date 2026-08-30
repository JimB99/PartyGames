import type { GameModule } from "@party-games/shared";
import { witShowdownPool } from "../content-pool.js";
import {
  createStarRateState,
  onStarRateAction,
  onStarRateTick,
  starRateHostView,
  starRatePlayerView,
  type StarRateState,
} from "../engines/star-rate-engine.js";

export const starRateGame: GameModule<StarRateState> = {
  meta: {
    id: "star-rate",
    name: "Star Rate",
    description: "Write answers, then rate everyone else's",
    scoringRules: "+1500 for highest average rating. +400 for participating.",
    minPlayers: 3,
    maxPlayers: 16,
    category: "social",
    supportsMatureContent: true,
    supportsDifficulty: true,
  },
  init(ctx) {
    return createStarRateState(witShowdownPool(ctx.gameOptions), ctx.playerIds, 4);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onStarRateAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onStarRateAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onStarRateTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, _ctx) {
    return starRateHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return starRatePlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
