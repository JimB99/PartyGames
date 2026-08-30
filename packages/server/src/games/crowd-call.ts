import type { GameModule } from "@party-games/shared";
import { crowdCallPool } from "../content-pool.js";
import {
  createCrowdState,
  onCrowdAction,
  onCrowdTick,
  crowdHostView,
  crowdPlayerView,
  type CrowdState,
} from "../engines/crowd-call-engine.js";

export const crowdCallGame: GameModule<CrowdState> = {
  meta: {
    id: "crowd-call",
    name: "Crowd Call",
    description: "Predict what the majority will pick",
    scoringRules: "+1000 for correct crowd prediction, +200 for playing.",
    minPlayers: 3,
    maxPlayers: 16,
    category: "party",
  },
  init(ctx) {
    return createCrowdState(crowdCallPool(ctx.gameOptions), ctx.playerIds, 4);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onCrowdAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onCrowdAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onCrowdTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, _ctx) {
    return crowdHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return crowdPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
