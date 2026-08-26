import type { GameModule } from "@party-games/shared";
import { content } from "../content.js";
import {
  createRoleSortState,
  onRoleSortAction,
  onRoleSortTick,
  roleSortHostView,
  roleSortPlayerView,
} from "../engines/role-sort-engine.js";

import type { RoleSortState } from "../engines/role-sort-engine.js";

export const roleSortGame: GameModule<RoleSortState> = {
  meta: {
    id: "role-sort",
    name: "Friend Sort",
    description: "Secretly sort friends into characters",
    scoringRules: "+500 when your role assignment matches the majority for a player.",
    minPlayers: 3,
    maxPlayers: 8,
    category: "social",
    supportsDifficulty: false,
    supportsMatureContent: false,
  },
  init(ctx) {
    return createRoleSortState("Muppets", content.muppets, ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onRoleSortAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onRoleSortAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onRoleSortTick(state, state.playerIds);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return roleSortHostView(state);
  },
  getPlayerView(state, playerId, ctx) {
    return roleSortPlayerView(state, playerId, ctx.playerIds);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
