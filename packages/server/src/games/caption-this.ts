import type { GameModule } from "@party-games/shared";
import { content } from "../content.js";
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
    description: "Write captions for absurd scenes",
    minPlayers: 3,
    maxPlayers: 16,
    category: "social",
  },
  init() {
    return createPromptVoteState("vote-all", content.caption);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onPromptVoteAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onPromptVoteAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onPromptVoteTick(state, content.caption);
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
