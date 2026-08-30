import type { GameModule } from "@party-games/shared";
import { impostorPool } from "../content-pool.js";
import {
  createImpostorState,
  onImpostorAction,
  onImpostorTick,
  impostorHostView,
  impostorPlayerView,
  type ImpostorState,
} from "../engines/impostor-engine.js";

export const impostorGame: GameModule<ImpostorState> = {
  meta: {
    id: "impostor",
    name: "Impostor",
    description: "One stranger doesn't know the secret — question them before they guess it",
    scoringRules: "Spy +400 for correct guess, +200 if uncaught. Others +200 if spy is caught.",
    minPlayers: 4,
    maxPlayers: 8,
    category: "social",
  },
  init(ctx) {
    return createImpostorState(impostorPool(ctx.gameOptions), ctx.playerIds, 4);
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
  getHostView(state, _ctx) {
    return impostorHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return impostorPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
