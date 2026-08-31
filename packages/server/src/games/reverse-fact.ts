import type { GameModule } from "@party-games/shared";
import { reverseFactPool } from "../content-pool.js";
import {
  bluffHostView,
  bluffPlayerView,
  createBluffState,
  onBluffAction,
  onBluffTick,
} from "../engines/bluff-engine.js";

import type { BluffState } from "../engines/bluff-engine.js";

export const reverseFactGame: GameModule<BluffState> = {
  meta: {
    id: "reverse-fact",
    name: "Reverse Fact",
    description: "Write the question that fits the fact",
    scoringRules: "+1000 for voting the real question; +500 to the author of a fake you voted for.",
    minPlayers: 2,
    maxPlayers: 16,
    category: "social",
    supportsDifficulty: true,
    supportsMatureContent: true,
    supportsSpeedScoring: true,
    roundScoresAreCumulative: true,
  },
  init(ctx) {
    const state = createBluffState("reverse-fact", reverseFactPool(ctx.gameOptions), 5, ctx.playerIds.length);
    state.gameOptions = ctx.gameOptions;
    return state;
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onBluffAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onBluffAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onBluffTick(state, undefined, state.gameOptions);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return bluffHostView(state);
  },
  getPlayerView(state, playerId) {
    return bluffPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.cumulativeScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
