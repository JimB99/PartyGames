import type { GameModule } from "@party-games/shared";
import { content } from "../content.js";
import {
  bluffHostView,
  bluffPlayerView,
  createBluffState,
  onBluffAction,
  onBluffTick,
} from "../engines/bluff-engine.js";

import type { BluffState } from "../engines/bluff-engine.js";

export const fibbageGame: GameModule<BluffState> = {
  meta: {
    id: "fibbage",
    name: "Fact Check",
    description: "Submit lies, vote for the truth",
    scoringRules: "+1000 for voting the real answer; +500 to the author of a lie you voted for.",
    minPlayers: 2,
    maxPlayers: 16,
    category: "social",
  },
  init(ctx) {
    return createBluffState("fibbage", content.fibbage);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onBluffAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onBluffAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onBluffTick(state, content.fibbage);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, ctx) {
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
