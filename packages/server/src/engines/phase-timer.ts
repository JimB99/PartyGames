import type { GameOptions } from "@party-games/shared";
import { isHostPacing, resolvePhaseDuration } from "@party-games/shared";

export function startPhaseTimer(
  ms: number,
  options?: GameOptions | null,
): { timerEndsAt: number | null; timerTotalMs: number | null } {
  const duration = resolvePhaseDuration(ms, options);
  if (duration <= 0) {
    return { timerEndsAt: null, timerTotalMs: null };
  }
  const now = Date.now();
  return { timerEndsAt: now + duration, timerTotalMs: duration };
}

export function clearPhaseTimer(): { timerEndsAt: null; timerTotalMs: null } {
  return { timerEndsAt: null, timerTotalMs: null };
}

export function isTimerExpired(
  timerEndsAt: number | null,
  options?: GameOptions | null,
): boolean {
  if (isHostPacing(options)) return false;
  return timerEndsAt !== null && Date.now() >= timerEndsAt;
}
