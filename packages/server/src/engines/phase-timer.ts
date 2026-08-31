export function startPhaseTimer(ms: number): { timerEndsAt: number; timerTotalMs: number } {
  const now = Date.now();
  return { timerEndsAt: now + ms, timerTotalMs: ms };
}

export function clearPhaseTimer(): { timerEndsAt: null; timerTotalMs: null } {
  return { timerEndsAt: null, timerTotalMs: null };
}
