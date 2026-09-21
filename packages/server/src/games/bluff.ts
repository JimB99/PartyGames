import type { GameModule } from "@party-games/shared";
import { resolveBluffMode } from "@party-games/shared";
import { factCheckPool, reverseFactPool } from "../content-pool.js";
import {
  bluffHostView,
  bluffPlayerView,
  createBluffState,
  onBluffAction,
  onBluffTick,
  type BluffState,
} from "../engines/bluff-engine.js";

export const bluffGame: GameModule<BluffState> = {
  meta: {
    id: "bluff",
    name: "Bluff",
    description: "Submit lies and vote for the truth — fill-in-the-blank or reverse-question mode",
    scoringRules: "+1000 for voting the real answer (ranked by speed when enabled); +500 to fool a voter.",
    minPlayers: 2,
    maxPlayers: 16,
    category: "social",
    supportsDifficulty: true,
    supportsMatureContent: true,
    supportsSpeedScoring: true,
    supportsBluffMode: true,
    roundScoresAreCumulative: true,
  },
  init(ctx) {
    const mode = resolveBluffMode(ctx.gameOptions);
    const pool = mode === "reverse-question" ? reverseFactPool(ctx.gameOptions) : factCheckPool(ctx.gameOptions);
    return createBluffState(mode, pool, 5, ctx.playerIds.length, ctx.gameOptions);
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
