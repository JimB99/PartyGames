import type { GameModule } from "@party-games/shared";
import {
  bsHostView,
  bsPlayerView,
  createBsGameState,
  onBsAction,
  onBsTick,
} from "../engines/battleship-engine.js";
import type { BattleshipState } from "../engines/battleship-engine.js";

export const battleshipsGame: GameModule<BattleshipState> = {
  meta: {
    id: "battleships",
    name: "Battleships",
    description: "1v1 classic duel or Fleet Royale for larger groups",
    scoringRules: "Winner 1000 pts. Fleet Royale: bet on eliminations and top hitters.",
    minPlayers: 2,
    maxPlayers: 8,
    category: "strategy",
  },
  init(ctx) {
    return createBsGameState(ctx.playerIds);
  },
  onPlayerAction(state, playerId, action) {
    return onBsAction(state, playerId, action);
  },
  onHostAction(state, action) {
    return onBsAction(state, "host", action);
  },
  onTick(state) {
    return onBsTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return bsHostView(state);
  },
  getPlayerView(state, playerId) {
    return bsPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
