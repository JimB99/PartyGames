import type { GameModule } from "@party-games/shared";
import { outOfPlacePool } from "../content-pool.js";
import {
  createOutOfPlaceState,
  onOutOfPlaceAction,
  onOutOfPlaceTick,
  outOfPlaceHostView,
  outOfPlacePlayerView,
  type OutOfPlaceState,
} from "../engines/out-of-place-engine.js";

export const outOfPlaceGame: GameModule<OutOfPlaceState> = {
  meta: {
    id: "out-of-place",
    name: "Out of Place",
    description: "One stranger doesn't know the secret — question them before they guess it",
    scoringRules: "Spy +400 for correct guess, +200 if uncaught. Others +200 if spy is caught.",
    minPlayers: 4,
    maxPlayers: 8,
    category: "social",
  },
  init(ctx) {
    return createOutOfPlaceState(outOfPlacePool(ctx.gameOptions), ctx.playerIds, 4);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onOutOfPlaceAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onOutOfPlaceAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onOutOfPlaceTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, _ctx) {
    return outOfPlaceHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return outOfPlacePlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
