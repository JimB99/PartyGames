import type { GameAction, GameModule, RoomContext } from "@party-games/shared";

/** Expire this state's timer and any nested `inner` timer (wrapped drawing/impostor games). */
export function expireNestedTimers(state: unknown, now = Date.now()): void {
  if (!state || typeof state !== "object") return;
  const s = state as Record<string, unknown>;
  if ("timerEndsAt" in s) {
    s.timerEndsAt = now - 1;
  }
  if (typeof s.discussUntil === "number") {
    s.discussUntil = now - 1;
  }
  if (s.inner && typeof s.inner === "object") {
    expireNestedTimers(s.inner, now);
  }
}

/**
 * Host Skip: always leave the current phase unless the game has already ended.
 * Uses onHostAction first; if the phase is unchanged, expires timers (including nested)
 * and ticks once so Auto and Host pacing both advance.
 */
export function applyHostSkip<TState>(
  game: GameModule<TState>,
  state: TState,
  ctx: RoomContext,
  action: GameAction = { kind: "advance" },
): TState {
  const before = game.getHostView(state, ctx).phase;
  if (before === "ended") return state;

  let next = state;
  if (game.onHostAction) {
    next = game.onHostAction(state, action, ctx);
  }
  if (game.getHostView(next, ctx).phase !== before) return next;

  expireNestedTimers(next);
  if (game.onTick && game.needsTick?.(next)) {
    next = game.onTick(next);
  }
  return next;
}
