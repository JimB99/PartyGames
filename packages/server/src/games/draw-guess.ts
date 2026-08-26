import type { GameModule } from "@party-games/shared";
import { content } from "../content.js";
import {
  createDrawState,
  drawHostView,
  drawPlayerView,
  onDrawAction,
  onDrawTick,
} from "../engines/drawing-engine.js";

import type { DrawState } from "../engines/drawing-engine.js";

export const drawGuessGame: GameModule<DrawState> = {
  meta: {
    id: "draw-guess",
    name: "Sketch It",
    description: "Draw prompts while others guess",
    scoringRules: "+500 for a correct guess; +250 to the drawer for each correct guesser.",
    minPlayers: 3,
    maxPlayers: 8,
    category: "drawing",
  },
  init(ctx) {
    return createDrawState(content.drawWords, ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onDrawAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onDrawAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onDrawTick(state, content.drawWords, state.playerIds);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, ctx) {
    return drawHostView(state, ctx.playerIds);
  },
  getPlayerView(state, playerId, ctx) {
    return drawPlayerView(state, playerId, ctx.playerIds);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
