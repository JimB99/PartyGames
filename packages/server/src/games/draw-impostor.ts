import type { GameModule } from "@party-games/shared";
import { impostorPool } from "../content-pool.js";
import {
  createDrawImpostorState,
  drawImpostorHostView,
  drawImpostorPlayerView,
  onDrawImpostorAction,
  onDrawImpostorTick,
  type DrawImpostorState,
} from "../engines/draw-impostor-engine.js";

export const drawImpostorGame: GameModule<DrawImpostorState> = {
  meta: {
    id: "draw-impostor",
    name: "Draw Impostor",
    description: "Draw the secret location — one player only knows the category",
    scoringRules: "Crew +600 if impostor caught; impostor +1000 if escapes, +400 for correct final guess.",
    minPlayers: 4,
    maxPlayers: 10,
    category: "creative",
    supportsMatureContent: true,
  },
  init(ctx) {
    const pool = impostorPool(ctx.gameOptions).flatMap((cat) =>
      cat.items.map((name) => ({ name, category: cat.label })),
    );
    return createDrawImpostorState(pool, ctx.playerIds);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onDrawImpostorAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onDrawImpostorAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onDrawImpostorTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return drawImpostorHostView(state);
  },
  getPlayerView(state, playerId) {
    return drawImpostorPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
