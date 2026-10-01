export type BlockStackGestureInput = "left" | "right" | "rotate_cw" | "soft_drop" | "hard_drop";

export function parseBlockStackGesture(
  dx: number,
  dy: number,
  opts?: { tapThreshold?: number; swipeThreshold?: number },
): BlockStackGestureInput | null {
  const tap = opts?.tapThreshold ?? 12;
  const swipe = opts?.swipeThreshold ?? 24;

  if (Math.abs(dx) < tap && Math.abs(dy) < tap) return "rotate_cw";

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx < -swipe) return "left";
    if (dx > swipe) return "right";
    return null;
  }

  if (dy > swipe) return "soft_drop";
  if (dy < -swipe) return "hard_drop";
  return null;
}

/** Consume one DAS step per `cellWidth` of accumulated axis travel. */
export function drainDasAxis(
  accumulated: number,
  cellWidth: number,
): { steps: number; remain: number } {
  if (cellWidth <= 0) return { steps: 0, remain: accumulated };
  const steps = Math.trunc(accumulated / cellWidth);
  return { steps, remain: accumulated - steps * cellWidth };
}
