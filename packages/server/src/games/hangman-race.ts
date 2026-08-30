import type { GameModule } from "@party-games/shared";
import { hangmanWordPool } from "../content-pool.js";
import {
  createHangmanRaceState,
  onHangmanRaceAction,
  onHangmanRaceTick,
  hangmanRaceHostView,
  hangmanRacePlayerView,
  type HangmanRaceState,
} from "../engines/hangman-race-engine.js";

export const hangmanRaceGame: GameModule<HangmanRaceState> = {
  meta: {
    id: "hangman-race",
    name: "Hangman Race",
    description: "Race to solve the same word before anyone else",
    scoringRules: "Rank points for solving first. Wrong solve costs 2 strikes.",
    minPlayers: 2,
    maxPlayers: 16,
    category: "arcade",
    supportsDifficulty: true,
    supportsSpeedScoring: true,
  },
  init(ctx) {
    return createHangmanRaceState(hangmanWordPool(ctx.gameOptions), ctx.playerIds, 4);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onHangmanRaceAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onHangmanRaceAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onHangmanRaceTick(state);
  },
  needsTick(state) {
    return state.phase !== "ended";
  },
  tickIntervalMs: 500,
  getHostView(state, _ctx) {
    return hangmanRaceHostView(state);
  },
  getPlayerView(state, playerId, _ctx) {
    return hangmanRacePlayerView(state, playerId);
  },
  getRoundScores(state) {
    return state.roundScores;
  },
  isGameOver(state) {
    return state.phase === "ended";
  },
};
