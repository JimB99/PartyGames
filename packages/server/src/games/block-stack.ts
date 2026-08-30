import type { GameModule } from "@party-games/shared";
import {
  createBlockStackGameState,
  onBlockStackAction,
  onBlockStackTick,
  blockStackHostView,
  blockStackPlayerView,
  blockStackRoundScores,
} from "../engines/block-stack-engine.js";
import type { BlockStackState } from "../engines/block-stack-engine.js";

export const blockStackGame: GameModule<BlockStackState> = {
  meta: {
    id: "block-stack",
    name: "Block Stack",
    description: "Survive the longest — last stack standing wins",
    scoringRules: "Rank by survival each round. Bonus points from line-clear score.",
    minPlayers: 2,
    maxPlayers: 8,
    category: "arcade",
  },
  init(ctx) {
    return createBlockStackGameState(ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onBlockStackAction(state, playerId, action, ctx.playerIds);
  },
  onHostAction(state, action, ctx) {
    return onBlockStackAction(state, "host", action, ctx.playerIds);
  },
  onTick(state) {
    return onBlockStackTick(state, state.players.map((p) => p.id));
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 60,
  getHostView(state) {
    return blockStackHostView(state);
  },
  getPlayerView(state, playerId) {
    return blockStackPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return blockStackRoundScores(state);
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
