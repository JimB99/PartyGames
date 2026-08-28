import type { GameModule } from "@party-games/shared";
import {
  createBotIds,
  createBotNames,
  resolveTrailDashOptions,
} from "@party-games/shared";
import {
  createCurveGameState,
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
    scoringRules:
      "Rank points by survival (last alive = most). Collect coins for bonus points. Power-ups: speed, ghost, double jump, missile, grenade, burst.",
    minPlayers: 1,
    maxPlayers: 8,
    category: "arcade",
    supportsDifficulty: false,
    supportsMatureContent: false,
    supportsTrailDashOptions: true,
  },
  init(ctx) {
    const options = resolveTrailDashOptions(ctx.gameOptions);
    const botIds = createBotIds(options.botCount);
    const botNames = createBotNames(botIds);
    const colorIndexByPlayer = Object.fromEntries(
      ctx.players.filter((p) => ctx.playerIds.includes(p.id)).map((p) => [p.id, p.colorIndex]),
    );
    return createCurveGameState(ctx.playerIds, botIds, botNames, options, colorIndexByPlayer);
  },
  onPlayerAction(state, playerId, action) {
    return onCurveAction(state, playerId, action);
  },
  onHostAction(state, action) {
    return onCurveAction(state, "host", action);
  },
  onTick(state) {
    const botIds = state.players.filter((p) => p.isBot).map((p) => p.id);
    const humanIds = state.players.filter((p) => !p.isBot).map((p) => p.id);
    return onCurveTick(state, humanIds, botIds);
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
