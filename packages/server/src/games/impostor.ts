import type { GameModule } from "@party-games/shared";
import {
  createImpostorState,
  impostorHostView,
  impostorPlayerView,
  onImpostorAction,
  onImpostorTick,
} from "../engines/hidden-role-engine.js";

import type { ImpostorState } from "../engines/hidden-role-engine.js";

export const impostorGame: GameModule<ImpostorState> = {
  meta: {
    id: "impostor",
    name: "Impostor",
    description: "Find the aliens among the crew",
    scoringRules: "+1500 to each surviving member of the winning team when the game ends.",
    minPlayers: 4,
    maxPlayers: 10,
    category: "party",
    supportsDifficulty: false,
    supportsMatureContent: false,
  },
  init(ctx) {
    return createImpostorState(ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onImpostorAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onImpostorAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onImpostorTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return impostorHostView(state);
  },
  getPlayerView(state, playerId) {
    return impostorPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
