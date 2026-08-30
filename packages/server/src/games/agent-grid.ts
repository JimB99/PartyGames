import type { GameModule } from "@party-games/shared";
import { agentGridWordPool } from "../content-pool.js";
import {
  createAgentGridState,
  onAgentGridAction,
  onAgentGridTick,
  agentGridHostView,
  agentGridPlayerView,
  type AgentGridState,
} from "../engines/agent-grid-engine.js";

export const agentGridGame: GameModule<AgentGridState> = {
  meta: {
    id: "agent-grid",
    name: "Agent Grid",
    description: "Spymasters give one-word clues — avoid the assassin",
    scoringRules: "Winning team +1500 each. Hit the assassin and your team loses instantly.",
    minPlayers: 4,
    maxPlayers: 12,
    category: "social",
    supportsMatureContent: true,
  },
  init(ctx) {
    return createAgentGridState(agentGridWordPool(ctx.gameOptions), ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onAgentGridAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onAgentGridAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onAgentGridTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, _ctx) {
    return agentGridHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return agentGridPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
