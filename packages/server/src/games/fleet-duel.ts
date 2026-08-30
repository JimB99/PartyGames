import type { GameModule } from "@party-games/shared";
import {
  fdHostView,
  fdPlayerView,
  createFdGameState,
  onFdAction,
  onFdTick,
} from "../engines/fleet-duel-engine.js";
import type { FleetDuelState } from "../engines/fleet-duel-engine.js";

export const fleetDuelGame: GameModule<FleetDuelState> = {
  meta: {
    id: "fleet-duel",
    name: "Fleet Duel",
    description: "1v1 classic duel or Fleet Royale for larger groups",
    scoringRules: "Winner 1000 pts. Fleet Royale: bet on eliminations and top hitters.",
    minPlayers: 2,
    maxPlayers: 8,
    category: "strategy",
  },
  init(ctx) {
    return createFdGameState(ctx.playerIds);
  },
  onPlayerAction(state, playerId, action) {
    return onFdAction(state, playerId, action);
  },
  onHostAction(state, action) {
    return onFdAction(state, "host", action);
  },
  onTick(state) {
    return onFdTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return fdHostView(state);
  },
  getPlayerView(state, playerId) {
    return fdPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
