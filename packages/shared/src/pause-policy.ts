import type { GameId } from "./constants.js";

const REALTIME_PLAYING_GAMES = new Set<GameId>([
  "block-stack",
  "trail-dash",
  "paddle-clash",
  "grid-blast",
]);

/** Realtime arcade games keep simulating during timer pause. */
export function shouldTickWhilePaused(gameId: GameId | null | undefined, phase: string): boolean {
  if (!gameId || phase !== "playing") return false;
  return REALTIME_PLAYING_GAMES.has(gameId);
}
