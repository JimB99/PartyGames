import type { GameModule } from "@party-games/shared";
import {
  fourInARowHostView,
  fourInARowPlayerView,
  createFourInARowGameState,
  onFourInARowAction,
  onFourInARowTick,
} from "../engines/four-in-a-row-engine.js";
import type { FourInARowState } from "../engines/four-in-a-row-engine.js";

export const fourInARowGame: GameModule<FourInARowState> = {
  meta: {
    id: "four-in-a-row",
    name: "Four in a Row",
    description: "Drop discs to connect four in a row",
    scoringRules: "Winner 1000 pts. King-of-the-hill: first to 2 mini-match wins.",
    minPlayers: 2,
    maxPlayers: 4,
    category: "strategy",
    roundScoresAreCumulative: true,
  },
  init(ctx) {
    return createFourInARowGameState(ctx.playerIds);
  },
  onPlayerAction(state, playerId, action) {
    return onFourInARowAction(state, playerId, action);
  },
  onHostAction(state, action) {
    return onFourInARowAction(state, "host", action);
  },
  onTick(state) {
    return onFourInARowTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return fourInARowHostView(state);
  },
  getPlayerView(state, playerId) {
    return fourInARowPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
