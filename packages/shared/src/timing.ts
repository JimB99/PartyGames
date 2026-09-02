export type TimerPreset = "relaxed" | "standard" | "quick";

export type SemanticTimer =
  | "instruction"
  | "answer"
  | "draw"
  | "guess"
  | "vote"
  | "reveal"
  | "turn"
  | "roundBreak";

export interface TimerDurations {
  instruction: number;
  answer: number;
  draw: number;
  guess: number;
  vote: number;
  reveal: number;
  turn: number;
  roundBreak: number;
}

export const TIMER_PRESETS: Record<TimerPreset, TimerDurations> = {
  relaxed: {
    instruction: 8000,
    answer: 60000,
    draw: 90000,
    guess: 90000,
    vote: 45000,
    reveal: 10000,
    turn: 30000,
    roundBreak: 8000,
  },
  standard: {
    instruction: 5000,
    answer: 45000,
    draw: 60000,
    guess: 60000,
    vote: 30000,
    reveal: 8000,
    turn: 20000,
    roundBreak: 5000,
  },
  quick: {
    instruction: 3000,
    answer: 30000,
    draw: 45000,
    guess: 45000,
    vote: 20000,
    reveal: 5000,
    turn: 15000,
    roundBreak: 3000,
  },
};

export function resolveTimerDurations(
  preset: TimerPreset = "standard",
  overrides: Partial<TimerDurations> = {},
): TimerDurations {
  const base = TIMER_PRESETS[preset];
  const result = { ...base };
  for (const key of Object.keys(overrides) as SemanticTimer[]) {
    const value = overrides[key];
    if (value !== undefined) {
      result[key] = Math.max(0, Math.round(value / 5000) * 5000);
    }
  }
  return result;
}

export function timerEndsAt(now: number, durationMs: number): number | null {
  if (durationMs <= 0) return null;
  return now + durationMs;
}

export function remainingMs(now: number, endsAt: number | null): number | null {
  if (endsAt === null) return null;
  return Math.max(0, endsAt - now);
}
