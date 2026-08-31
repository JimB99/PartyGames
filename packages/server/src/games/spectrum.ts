import type { GameModule } from "@party-games/shared";
import { spectrumPool } from "../content-pool.js";
import {
  createSpectrumState,
  onSpectrumAction,
  onSpectrumTick,
  spectrumHostView,
  spectrumPlayerView,
  type SpectrumState,
} from "../engines/spectrum-engine.js";

export const spectrumGame: GameModule<SpectrumState> = {
  meta: {
    id: "spectrum",
    name: "Spectrum",
    description: "Give a clue on a sliding scale — others guess where you meant",
    scoringRules: "+1000 minus 10 per point off the target. Clue giver earns half of the best guess.",
    minPlayers: 3,
    maxPlayers: 12,
    category: "social",
    roundScoresAreCumulative: true,
  },
  init(ctx) {
    return createSpectrumState(spectrumPool(ctx.gameOptions), ctx.playerIds, ctx.playerIds.length);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onSpectrumAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onSpectrumAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onSpectrumTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, _ctx) {
    return spectrumHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return spectrumPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.cumulativeScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
