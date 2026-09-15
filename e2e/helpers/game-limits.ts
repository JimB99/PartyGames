import type { GameId } from "../../packages/shared/src/constants.ts";

/** Per-game step budget for @full playthrough loops (default 80). */
export const GAME_FULL_MAX_STEPS: Partial<Record<GameId, number>> = {
  "fleet-duel": 150,
  "four-in-a-row": 150,
  "tic-tac-toe": 120,
  "hangman-race": 120,
  "last-on-the-dike": 80,
  "trail-dash": 100,
  "agent-grid": 150,
  impostor: 100,
};

export function fullMaxStepsFor(gameId: GameId): number {
  return GAME_FULL_MAX_STEPS[gameId] ?? 80;
}
