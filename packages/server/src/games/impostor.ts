import type { GameModule } from "@party-games/shared";
import { resolveImpostorStyle } from "@party-games/shared";
import { impostorPool } from "../content-pool.js";
import {
  createImpostorGameState,
  impostorGameHostView,
  impostorGameIsGameOver,
  impostorGameNeedsTick,
  impostorGamePlayerView,
  impostorGameRoundScores,
  onImpostorGameAction,
  onImpostorGameTick,
  type ImpostorGameState,
} from "../engines/impostor-game-engine.js";

export const impostorGame: GameModule<ImpostorGameState> = {
  meta: {
    id: "impostor",
    name: "Impostor",
    description: "Find the spy who doesn't know the secret — verbal or draw mode",
    scoringRules: "Spy +400 for correct guess, +200 if uncaught. Others +200 if spy is caught.",
    minPlayers: 4,
    maxPlayers: 10,
    category: "social",
    supportsMatureContent: true,
    supportsImpostorStyle: true,
  },
  init(ctx) {
    const style = resolveImpostorStyle(ctx.gameOptions);
    const verbalPool = impostorPool(ctx.gameOptions);
    const drawLocations = verbalPool.flatMap((cat) =>
      cat.items.map((name) => ({ name, category: cat.label })),
    );
    return createImpostorGameState(style, verbalPool, drawLocations, ctx.playerIds, ctx.gameOptions);
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onImpostorGameAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onImpostorGameAction(state, "host", action, ctx);
  },
  onTick(state) {
    return onImpostorGameTick(state);
  },
  needsTick: impostorGameNeedsTick,
  tickIntervalMs: 500,
  getHostView(state) {
    return impostorGameHostView(state);
  },
  getPlayerView(state, playerId) {
    return impostorGamePlayerView(state, playerId);
  },
  getRoundScores: impostorGameRoundScores,
  isGameOver: impostorGameIsGameOver,
};
