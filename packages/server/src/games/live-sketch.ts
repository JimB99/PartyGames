import type { GameModule } from "@party-games/shared";
import { drawWordPool } from "../content-pool.js";
import {
  createLiveSketchState,
  liveSketchHostView,
  liveSketchIsGameOver,
  liveSketchNeedsTick,
  liveSketchPlayerView,
  liveSketchRoundScores,
  onLiveSketchAction,
  onLiveSketchRosterChange,
  onLiveSketchTick,
  type LiveSketchState,
} from "../engines/live-sketch-engine.js";

export const liveSketchGame: GameModule<LiveSketchState> = {
  meta: {
    id: "live-sketch",
    name: "Live Sketch",
    description: "One person draws live; everyone else races to guess the word",
    scoringRules:
      "Rank points for guessing the word (or +500 each if speed scoring is off). Drawer +250 per correct guesser, max +1000.",
    minPlayers: 2,
    maxPlayers: 12,
    category: "creative",
    supportsMatureContent: true,
    supportsSpeedScoring: true,
    supportsLiveSketchOptions: true,
  },
  init(ctx) {
    return createLiveSketchState(drawWordPool(ctx.gameOptions), ctx.playerIds, ctx.gameOptions);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onLiveSketchAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onLiveSketchAction(state, "host", action, ctx);
  },
  onRosterChange(state, ctx) {
    return onLiveSketchRosterChange(state, ctx);
  },
  onTick(state) {
    return onLiveSketchTick(state);
  },
  needsTick: liveSketchNeedsTick,
  tickIntervalMs: 500,
  getHostView(state, ctx) {
    return liveSketchHostView(state, ctx);
  },
  getPlayerView(state, playerId, ctx) {
    return liveSketchPlayerView(state, playerId, ctx);
  },
  getRoundScores: liveSketchRoundScores,
  isGameOver: liveSketchIsGameOver,
};
