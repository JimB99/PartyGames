import type { GameModule } from "@party-games/shared";
import { pickRandom } from "@party-games/shared";
import { hotSeatPool } from "../content-pool.js";
import {
  createPromptVoteState,
  onPromptVoteAction,
  onPromptVoteTick,
  promptVoteHostView,
  promptVotePlayerView,
} from "../engines/prompt-vote-engine.js";

import type { PromptVoteState } from "../engines/prompt-vote-engine.js";

export const hotSeatGame: GameModule<PromptVoteState> = {
  meta: {
    id: "hot-seat",
    name: "Hot Seat",
    description: "Answer about the hot seat player",
    scoringRules: "+1000 if the hot seat player picks your answer.",
    minPlayers: 3,
    maxPlayers: 10,
    category: "social",
    supportsDifficulty: true,
    supportsMatureContent: true,
  },
  init(ctx) {
    const targetPlayerId = pickRandom(ctx.playerIds);
    return createPromptVoteState("hot-seat", hotSeatPool(ctx.gameOptions), 4, targetPlayerId);
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
