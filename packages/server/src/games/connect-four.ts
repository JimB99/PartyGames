import type { GameModule } from "@party-games/shared";
import {
  cfHostView,
  cfPlayerView,
  createCfGameState,
  onCfAction,
  onCfTick,
} from "../engines/connect-four-engine.js";
import type { ConnectFourState } from "../engines/connect-four-engine.js";

export const connectFourGame: GameModule<ConnectFourState> = {
  meta: {
    id: "connect-four",
    name: "Connect Four",
    description: "Drop discs to connect four in a row",
    scoringRules: "Winner 1000 pts. King-of-the-hill: first to 2 mini-match wins.",
    minPlayers: 2,
    maxPlayers: 4,
    category: "strategy",
  },
  init(ctx) {
    return createCfGameState(ctx.playerIds);
  },
  onPlayerAction(state, playerId, action) {
    return onCfAction(state, playerId, action);
  },
  onHostAction(state, action) {
    return onCfAction(state, "host", action);
  },
  onTick(state) {
    return onCfTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return cfHostView(state);
  },
  getPlayerView(state, playerId) {
    return cfPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
