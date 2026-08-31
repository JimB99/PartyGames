import type { GameModule } from "@party-games/shared";
import {
  createPaddleClashState,
  onPaddleClashAction,
  onPaddleClashTick,
  paddleClashHostView,
  paddleClashPlayerView,
  type PaddleClashGameState,
} from "../engines/paddle-clash-engine.js";

export const paddleClashGame: GameModule<PaddleClashGameState> = {
  meta: {
    id: "paddle-clash",
    name: "Paddle Clash",
    description: "Pong and air-hockey on the big screen — phones control your paddle",
    scoringRules: "First to 7 points wins.",
    minPlayers: 2,
    maxPlayers: 4,
    category: "arcade",
    roundScoresAreCumulative: true,
    supportsPaddleMode: true,
  },
  init(ctx) {
    const mode = ctx.gameOptions.paddleMode ?? "pong";
    return createPaddleClashState(ctx.playerIds, mode);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onPaddleClashAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onPaddleClashAction(state, "host", action, ctx.playerIds);
  },
  onTick(state) {
    return onPaddleClashTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 40,
  getHostView(state, _ctx) {
    return paddleClashHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return paddleClashPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
