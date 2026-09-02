import type { GameModule } from "@party-games/shared";
import { drawWordPool } from "../content-pool.js";
import {
  createDrawVoteState,
  drawVoteHostView,
  drawVotePlayerView,
  onDrawVoteAction,
  onDrawVoteTick,
  type DrawVoteState,
} from "../engines/draw-vote-engine.js";

export const drawVoteGame: GameModule<DrawVoteState> = {
  meta: {
    id: "draw-vote",
    name: "Draw & Vote",
    description: "Everyone draws the same prompt — guess the artist or vote for the best drawing",
    scoringRules: "Artist guess: +500 correct, +250 to artist. Best drawing: +800 winner, +100 for voting.",
    minPlayers: 3,
    maxPlayers: 12,
    category: "creative",
    supportsDifficulty: true,
    supportsMatureContent: true,
  },
  init(ctx) {
    return createDrawVoteState(drawWordPool(ctx.gameOptions), ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onDrawVoteAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onDrawVoteAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onDrawVoteTick(state, state.wordsPool, state.playerIds);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return drawVoteHostView(state);
  },
  getPlayerView(state, playerId) {
    return drawVotePlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
