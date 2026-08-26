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
    description: "Write the funniest caption for a scene",
    scoringRules: "+1000 for the caption with the most votes.",
    minPlayers: 3,
    maxPlayers: 16,
    category: "social",
    supportsDifficulty: true,
    supportsMatureContent: true,
  },
  init(ctx) {
    return createPromptVoteState("vote-all", captionPool(ctx.gameOptions));
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
  getHostView(state) {
    return promptVoteHostView(state);
  },
  getPlayerView(state, playerId) {
    return promptVotePlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
