import type { GameModule } from "@party-games/shared";
import { drawWordPool } from "../content-pool.js";
import {
  createChainSketchState,
  onChainAction,
  onChainTick,
  chainHostView,
  chainPlayerView,
  type ChainSketchState,
} from "../engines/chain-sketch-engine.js";

export const chainSketchGame: GameModule<ChainSketchState> = {
  meta: {
    id: "chain-sketch",
    name: "Chain Sketch",
    description: "Draw and guess — watch the prompt mutate down the chain",
    scoringRules: "+500 for starting the chain. Laughs guaranteed.",
    minPlayers: 3,
    maxPlayers: 8,
    category: "creative",
    supportsMatureContent: true,
    supportsDifficulty: true,
  },
  init(ctx) {
    const words = drawWordPool(ctx.gameOptions).map((w) => w.word);
    return createChainSketchState(words, ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onChainAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onChainAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onChainTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, _ctx) {
    return chainHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return chainPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
