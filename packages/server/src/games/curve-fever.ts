import type { GameModule } from "@party-games/shared";
import {
  createCurveState,
  curveHostView,
  curvePlayerView,
  onCurveAction,
  onCurveTick,
} from "../engines/realtime-arena.js";

import type { CurveState } from "../engines/realtime-arena.js";

export const curveFeverGame: GameModule<CurveState> = {
  meta: {
    id: "curve-fever",
    name: "Trail Dash",
    description: "Don't crash your trail — last alive wins",
    scoringRules: "+1000 for winning each round (last player alive).",
    minPlayers: 2,
    maxPlayers: 8,
    category: "action",
    supportsDifficulty: false,
    supportsMatureContent: false,
  },
  init(ctx) {
    return createCurveState(ctx.playerIds);
  },
  onPlayerAction(state, playerId, action) {
    return onCurveAction(state, playerId, action);
  },
  onHostAction(state, action) {
    return onCurveAction(state, "host", action);
  },
  onTick(state) {
    return onCurveTick(state, state.players.map((p) => p.id));
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 40,
  getHostView(state) {
    return curveHostView(state);
  },
  getPlayerView(state, playerId) {
    return curvePlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
