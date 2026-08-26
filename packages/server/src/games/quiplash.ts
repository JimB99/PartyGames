import type { GameModule } from "@party-games/shared";
import { quiplashPool } from "../content-pool.js";
import {
  createPromptVoteState,
  onPromptVoteAction,
  onPromptVoteTick,
  promptVoteHostView,
  promptVotePlayerView,
} from "../engines/prompt-vote-engine.js";

import type { PromptVoteState } from "../engines/prompt-vote-engine.js";

export const quiplashGame: GameModule<PromptVoteState> = {
  meta: {
    id: "quiplash",
    name: "Wit Showdown",
    description: "Answer bizarre prompts, vote for the funniest",
    scoringRules: "+1000 for winning each head-to-head matchup vote.",
    minPlayers: 3,
    maxPlayers: 16,
    category: "social",
    supportsDifficulty: true,
    supportsMatureContent: true,
  },
  init(ctx) {
    return createPromptVoteState("quiplash", quiplashPool(ctx.gameOptions));
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
