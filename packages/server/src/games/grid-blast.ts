import type { GameModule } from "@party-games/shared";
import {
  createGridBlastGameState,
  onGridBlastAction,
  onGridBlastTick,
  gridBlastHostView,
  gridBlastPlayerView,
  type GridBlastGameState,
} from "../engines/grid-blast-engine.js";

export const gridBlastGame: GameModule<GridBlastGameState> = {
  meta: {
    id: "grid-blast",
    name: "Grid Blast",
    description: "Drop bombs, chain explosions, be the last one standing",
    scoringRules: "Placement points each round. Power-ups from crates.",
    minPlayers: 2,
    maxPlayers: 8,
    category: "arcade",
    roundScoresAreCumulative: true,
  },
  init(ctx) {
    return createGridBlastGameState(ctx.playerIds, 3);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onGridBlastAction(state, playerId, action, ctx.playerIds);
  },
  onHostAction(state, action, ctx) {
    return onGridBlastAction(state, "host", action, ctx.playerIds);
  },
  onTick(state) {
    return onGridBlastTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 40,
  getHostView(state, _ctx) {
    return gridBlastHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return gridBlastPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
