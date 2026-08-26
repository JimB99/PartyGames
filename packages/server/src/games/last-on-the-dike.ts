import type { GameModule } from "@party-games/shared";
import {
  createDikeState,
  dikeHostView,
  dikePlayerView,
  onDikeAction,
  onDikeTick,
} from "../engines/dike-engine.js";

import type { DikeState } from "../engines/dike-engine.js";

export const lastOnTheDikeGame: GameModule<DikeState> = {
  meta: {
    id: "last-on-the-dike",
    name: "Last on the Dike",
    description: "Bid just enough to survive (based on Ostfriesische Deichwandern)",
    scoringRules: "3000 for 1st, 1500 for 2nd, 750 for 3rd, 250 for other survivors.",
    minPlayers: 4,
    maxPlayers: 16,
    category: "social",
    supportsDifficulty: false,
    supportsMatureContent: false,
  },
  init(ctx) {
    return createDikeState(ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onDikeAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onDikeAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onDikeTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return dikeHostView(state);
  },
  getPlayerView(state, playerId) {
    return dikePlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
