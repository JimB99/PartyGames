export interface TimedPhaseState {
  phase: string;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  phaseRevision?: number;
}

export function beginTimedPhase<T extends TimedPhaseState>(
  state: T,
  phase: string,
  now: number,
  durationMs: number,
): T {
  return {
    ...state,
    phase,
    phaseRevision: (state.phaseRevision ?? 0) + 1,
    timerEndsAt: durationMs > 0 ? now + durationMs : null,
    timerTotalMs: durationMs > 0 ? durationMs : null,
  };
}

export function clearTimedPhase<T extends TimedPhaseState>(state: T): T {
  return {
    ...state,
    timerEndsAt: null,
    timerTotalMs: null,
  };
}

export function isPhaseExpired(state: TimedPhaseState, now: number): boolean {
  return state.timerEndsAt !== null && now >= state.timerEndsAt;
}

export function allActiveSubmitted(
  activeIds: string[],
  submitted: Set<string> | string[],
): boolean {
  const set = submitted instanceof Set ? submitted : new Set(submitted);
  return activeIds.length > 0 && activeIds.every((id) => set.has(id));
}

const PHASE_LABELS: Record<string, string> = {
  instructions: "Get ready",
  submit: "Write your answer",
  vote: "Vote",
  drawing: "Draw",
  guessing: "Guess",
  guess: "Guess",
  reveal: "Reveal",
  scoreboard: "Scores",
  playing: "Playing",
  ended: "Game over",
  question: "Question",
  discuss: "Discuss",
  matchup: "Head to head",
  pick: "Choose",
  assign: "Assign roles",
  bid: "Bid",
  acting: "Acting",
  clue: "Give a clue",
  predict: "Predict the room",
  answer: "Answer",
  accusation: "Accuse",
  questioning: "Discuss",
  placement: "Place your ships",
  battle: "Battle",
  fire: "Fire",
  betting: "Place bets",
  round_end: "Round over",
  rate: "Rate",
  accuse: "Accuse",
  discussion: "Discuss",
  draw: "Draw",
  match_end: "Match over",
};

export function friendlyPhaseLabel(phase: string): string {
  return PHASE_LABELS[phase] ?? phase.replace(/-/g, " ");
}
