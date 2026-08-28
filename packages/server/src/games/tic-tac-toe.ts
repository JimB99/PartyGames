import type { GameModule } from "@party-games/shared";
import {
  createTttGameState,
  onTttAction,
  onTttTick,
  tttHostView,
  tttPlayerView,
} from "../engines/tic-tac-toe-engine.js";
import type { TicTacToeState } from "../engines/tic-tac-toe-engine.js";

export const ticTacToeGame: GameModule<TicTacToeState> = {
  meta: {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    description: "Classic 3×3 — bracket tournament for larger groups",
    scoringRules: "Winner 1000 pts, finalists 500, others 100.",
    minPlayers: 2,
    maxPlayers: 8,
    category: "strategy",
  },
  init(ctx) {
    return createTttGameState(ctx.playerIds);
  },
  onPlayerAction(state, playerId, action) {
    return onTttAction(state, playerId, action);
  },
  onHostAction(state, action) {
    return onTttAction(state, "host", action);
  },
  onTick(state) {
    return onTttTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return tttHostView(state);
  },
  getPlayerView(state, playerId) {
    return tttPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
