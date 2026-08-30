import type { GameModule } from "@party-games/shared";
import { splitRoomPool } from "../content-pool.js";
import {
  createSplitState,
  onSplitAction,
  onSplitTick,
  splitHostView,
  splitPlayerView,
  type SplitState,
} from "../engines/split-room-engine.js";

export const splitTheRoomGame: GameModule<SplitState> = {
  meta: {
    id: "split-the-room",
    name: "Split the Room",
    description: "Pick a side — points for the minority",
    scoringRules: "+1000 if you voted with the smaller side.",
    minPlayers: 3,
    maxPlayers: 16,
    category: "social",
    supportsMatureContent: true,
  },
  init(ctx) {
    return createSplitState(splitRoomPool(ctx.gameOptions), ctx.playerIds, 4);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onSplitAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onSplitAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onSplitTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, _ctx) {
    return splitHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return splitPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
