import type { GameModule } from "@party-games/shared";
import { forbiddenCluePool } from "../content-pool.js";
import {
  createForbiddenState,
  onForbiddenAction,
  onForbiddenTick,
  forbiddenHostView,
  forbiddenPlayerView,
  type ForbiddenState,
} from "../engines/forbidden-clue-engine.js";

export const forbiddenClueGame: GameModule<ForbiddenState> = {
  meta: {
    id: "forbidden-clue",
    name: "Forbidden Clue",
    description: "Describe the word without saying the forbidden terms",
    scoringRules: "+500 per correct word. -100 per foul. Max 3 skips per turn.",
    minPlayers: 4,
    maxPlayers: 12,
    category: "party",
    supportsMatureContent: true,
    roundScoresAreCumulative: true,
  },
  init(ctx) {
    return createForbiddenState(forbiddenCluePool(ctx.gameOptions), ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onForbiddenAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onForbiddenAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onForbiddenTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, _ctx) {
    return forbiddenHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return forbiddenPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
