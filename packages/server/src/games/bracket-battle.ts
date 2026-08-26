import type { GameModule } from "@party-games/shared";
import { content } from "../content.js";
import {
  bracketHostView,
  bracketPlayerView,
  createBracketState,
  onBracketAction,
  onBracketTick,
} from "../engines/bracket-engine.js";

import type { BracketState } from "../engines/bracket-engine.js";

export const bracketBattleGame: GameModule<BracketState> = {
  meta: {
    id: "bracket-battle",
    name: "Bracket Rumble",
    description: "Submit entries, vote through a bracket",
    scoringRules: "+2000 to the author of the bracket champion.",
    minPlayers: 4,
    maxPlayers: 16,
    category: "social",
  },
  init() {
    return createBracketState(content.bracketCategories);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onBracketAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onBracketAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onBracketTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state) {
    return bracketHostView(state);
  },
  getPlayerView(state, playerId) {
    return bracketPlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
