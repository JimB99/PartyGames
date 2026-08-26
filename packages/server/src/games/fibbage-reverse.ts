import type { GameModule } from "@party-games/shared";
import { fibbageReversePool } from "../content-pool.js";
import {
  bluffHostView,
  bluffPlayerView,
  createBluffState,
  onBluffAction,
  onBluffTick,
} from "../engines/bluff-engine.js";

import type { BluffState } from "../engines/bluff-engine.js";

export const fibbageReverseGame: GameModule<BluffState> = {
  meta: {
    id: "fibbage-reverse",
    name: "Reverse Fact",
    description: "Write the question that fits the fact",
    scoringRules: "+1000 for voting the real question; +500 to the author of a fake you voted for.",
    minPlayers: 2,
    maxPlayers: 16,
    category: "social",
    supportsDifficulty: true,
    supportsMatureContent: false,
  },
  init(ctx) {
    return createBluffState("reverse", fibbageReversePool(ctx.gameOptions));
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onBluffAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onBluffAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onBluffTick(state);
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
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
