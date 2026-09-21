import type { GameModule } from "@party-games/shared";
import { resolveDrawingStyle } from "@party-games/shared";
import { drawWordPool } from "../content-pool.js";
import {
  createDrawingGameState,
  drawingGameHostView,
  drawingGameIsGameOver,
  drawingGameNeedsTick,
  drawingGamePlayerView,
  drawingGameRoundScores,
  onDrawingGameAction,
  onDrawingGameTick,
  type DrawingGameState,
} from "../engines/drawing-game-engine.js";

function innerPlayerIds(state: DrawingGameState): string[] {
  return state.inner.playerIds;
}

function innerGameOptions(state: DrawingGameState) {
  return "gameOptions" in state.inner ? state.inner.gameOptions : undefined;
}

export const drawingGame: GameModule<DrawingGameState> = {
  meta: {
    id: "drawing",
    name: "Drawing",
    description: "Pictionary, telephone chain, or everyone draws and votes",
    scoringRules: "+500 per correct guess or chain start; all-draw mode awards best drawing or artist guess.",
    minPlayers: 3,
    maxPlayers: 12,
    category: "creative",
    supportsDifficulty: true,
    supportsMatureContent: true,
    supportsSpeedScoring: true,
    supportsDrawingStyle: true,
    supportsDrawVoteStyle: true,
  },
  init(ctx) {
    const style = resolveDrawingStyle(ctx.gameOptions);
    const words = drawWordPool(ctx.gameOptions);
    return createDrawingGameState(style, words, ctx.playerIds, ctx.gameOptions);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onDrawingGameAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onDrawingGameAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onDrawingGameTick(state, innerPlayerIds(state));
  },
  needsTick: drawingGameNeedsTick,
  tickIntervalMs: 500,
  getHostView(state, ctx) {
    return drawingGameHostView(state, ctx.playerIds, innerGameOptions(state));
  },
  getPlayerView(state, playerId, ctx) {
    return drawingGamePlayerView(state, playerId, ctx.playerIds, innerGameOptions(state));
  },
  getRoundScores: drawingGameRoundScores,
  isGameOver: drawingGameIsGameOver,
};
