import type { GameId } from "./constants.js";
import {
  DEFAULT_GAME_OPTIONS,
  DEFAULT_TIMELINE_PTS_PER_YEAR_OFF,
  TIMELINE_PTS_PER_YEAR_MAX,
  type GameOptions,
} from "./content.js";
import { resolveTrailDashOptions } from "./trail-dash-options.js";

/** Merge, clamp, and persist a canonical options object for a game. */
export function normalizeGameOptions(_gameId: GameId, options: GameOptions): GameOptions {
  const merged: GameOptions = {
    ...DEFAULT_GAME_OPTIONS,
    ...options,
  };

  if (merged.timelinePtsPerYearOff !== undefined) {
    merged.timelinePtsPerYearOff = Math.max(
      1,
      Math.min(merged.timelinePtsPerYearOff, TIMELINE_PTS_PER_YEAR_MAX),
    );
  }

  if (merged.trailDash !== undefined || _gameId === "trail-dash") {
    const resolved = resolveTrailDashOptions(merged);
    merged.trailDash = { ...resolved };
  }

  if (merged.hostPacing !== undefined) {
    merged.hostPacing = Boolean(merged.hostPacing);
  }

  return merged;
}

export function isHostPacing(options: GameOptions | null | undefined): boolean {
  return options?.hostPacing === true;
}

export function isTimerExpired(
  timerEndsAt: number | null,
  options?: GameOptions | null,
): boolean {
  if (isHostPacing(options)) return false;
  return timerEndsAt !== null && Date.now() >= timerEndsAt;
}
