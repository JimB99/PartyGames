import type { GameModule } from "@party-games/shared";
import { captionPool } from "../content-pool.js";
import {
  createPromptVoteState,
  onPromptVoteAction,
  onPromptVoteTick,
  promptVoteHostView,
  promptVotePlayerView,
} from "../engines/prompt-vote-engine.js";
import type { PromptVoteState } from "../engines/prompt-vote-engine.js";

export const captionThisGame: GameModule<PromptVoteState> = {
  meta: {
    id: "caption-this",
    name: "Caption This",
    description: "Write the funniest caption for a scene, then vote head-to-head",
    scoringRules: "+1000 for winning each head-to-head matchup vote.",
    minPlayers: 3,
    maxPlayers: 16,
    category: "social",
    supportsDifficulty: true,
    supportsMatureContent: true,
    roundScoresAreCumulative: true,
  },
  init(ctx) {
    return createPromptVoteState("caption", captionPool(ctx.gameOptions), 4, undefined, ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onPromptVoteAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onPromptVoteAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onPromptVoteTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, ctx) {
    return promptVoteHostView(state, ctx);
  },
  getPlayerView(state, playerId, ctx) {
    return promptVotePlayerView(state, playerId, ctx);
  },
  getRoundScores(state) {
    return state.cumulativeScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
