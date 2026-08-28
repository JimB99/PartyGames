import type { GameModule } from "@party-games/shared";
import {
  createTetrisGameState,
  onTetrisAction,
  onTetrisTick,
  tetrisHostView,
  tetrisPlayerView,
  tetrisRoundScores,
} from "../engines/tetris-engine.js";
import type { TetrisState } from "../engines/tetris-engine.js";

export const tetrisBattleGame: GameModule<TetrisState> = {
  meta: {
    id: "tetris-battle",
    name: "Tetris Battle",
    description: "Survive the longest — last stack standing wins",
    scoringRules: "Rank by survival each round. Bonus points from line-clear score.",
    minPlayers: 2,
    maxPlayers: 8,
    category: "arcade",
  },
  init(ctx) {
    return createTetrisGameState(ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onTetrisAction(state, playerId, action, ctx.playerIds);
  },
  onHostAction(state, action, ctx) {
    return onTetrisAction(state, "host", action, ctx.playerIds);
  },
  onTick(state) {
    return onTetrisTick(state, state.players.map((p) => p.id));
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 60,
  getHostView(state) {
    return tetrisHostView(state);
  },
  getPlayerView(state, playerId) {
    return tetrisPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return tetrisRoundScores(state);
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
