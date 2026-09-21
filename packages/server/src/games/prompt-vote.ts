import type { GameModule } from "@party-games/shared";
import { pickRandom, resolvePromptVoteStyle } from "@party-games/shared";
import { hotSeatPool, punchlineBattlePool } from "../content-pool.js";
import {
  createPromptVoteState,
  onPromptVoteAction,
  onPromptVoteTick,
  promptVoteHostView,
  promptVotePlayerView,
  type PromptVoteState,
} from "../engines/prompt-vote-engine.js";

export const promptVoteGame: GameModule<PromptVoteState> = {
  meta: {
    id: "prompt-vote",
    name: "Write & Vote",
    description: "Write the best answer — bracket tournament or hot-seat picks",
    scoringRules: "+1000 for winning each bracket vote, or if the hot seat picks your answer.",
    minPlayers: 3,
    maxPlayers: 16,
    category: "social",
    supportsDifficulty: true,
    supportsMatureContent: true,
    supportsPromptVoteStyle: true,
    roundScoresAreCumulative: true,
  },
  init(ctx) {
    const style = resolvePromptVoteStyle(ctx.gameOptions);
    const pool = style === "hot-seat" ? hotSeatPool(ctx.gameOptions) : punchlineBattlePool(ctx.gameOptions);
    const targetPlayerId = style === "hot-seat" ? pickRandom(ctx.playerIds) : undefined;
    return createPromptVoteState(style, pool, 4, targetPlayerId, ctx.playerIds, ctx.gameOptions);
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
    const view = promptVoteHostView(state, ctx);
    return {
      ...view,
      data: { ...view.data, promptVoteStyle: state.mode === "hot-seat" ? "hot-seat" : "bracket" },
    };
  },
  getPlayerView(state, playerId, ctx) {
    const view = promptVotePlayerView(state, playerId, ctx);
    return {
      ...view,
      data: { ...view.data, promptVoteStyle: state.mode === "hot-seat" ? "hot-seat" : "bracket" },
    };
  },
  getRoundScores(state) {
    return state.cumulativeScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
