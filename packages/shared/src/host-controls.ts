export interface HostControls {
  canPause: boolean;
  canExtendTime: boolean;
  canSkip: boolean;
  canReturnToLobby: boolean;
}

const SKIPPABLE_PHASES = new Set([
  "instructions",
  "reveal",
  "scoreboard",
  "round_end",
  "match_end",
  "bid",
  "placement",
  "betting",
  "drawing",
  "submit",
  "vote",
  "rate",
  "clue",
  "guess",
  "assign",
  "task",
  "eject",
  "questioning",
  "accusation",
]);

export function resolveHostControls(view: {
  phase: string;
  timerEndsAt: number | null;
}): HostControls {
  const hasTimer = view.timerEndsAt != null;
  const canSkip = hasTimer || SKIPPABLE_PHASES.has(view.phase);

  return {
    canPause: true,
    canExtendTime: hasTimer,
    canSkip,
    canReturnToLobby: true,
  };
}
