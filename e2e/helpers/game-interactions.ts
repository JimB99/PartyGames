import type { GameId } from "../../packages/shared/src/constants.ts";

export interface GameInteractions {
  host: string[];
  player: string[];
}

/** Primary interactive controls per game for E2E and audit. Prefix entries end with * for pattern match. */
export const GAME_INTERACTIONS: Record<GameId, GameInteractions> = {
  bluff: { host: ["host-skip"], player: ["player-text-input", "player-submit"] },
  "prompt-vote": { host: ["host-skip"], player: ["player-text-input", "player-submit"] },
  opinions: {
    host: ["host-skip"],
    player: ["wyr-choice-a", "wyr-choice-b", "split-vote-a", "crowd-call-option-0"],
  },
  spectrum: { host: ["host-skip"], player: ["spectrum-slider", "spectrum-lock-in"] },
  impostor: {
    host: ["host-skip"],
    player: ["impostor-accuse-*", "impostor-guess-*", "draw-canvas"],
  },
  "agent-grid": { host: ["host-skip"], player: ["agent-grid-tile-0"] },
  "bracket-battle": { host: ["host-skip"], player: ["player-text-input", "player-submit"] },
  "forbidden-clue": { host: ["host-skip"], player: ["forbidden-got-it"] },
  "team-charades": { host: ["host-skip"], player: ["charades-correct"] },
  "last-on-the-dike": { host: ["host-skip"], player: ["dike-bid-submit"] },
  trivia: { host: ["host-skip", "host-extend"], player: ["player-answer-0", "timeline-lock-in"] },
  drawing: { host: ["host-skip"], player: ["draw-canvas", "player-text-input"] },
  "trail-dash": {
    host: ["host-skip"],
    player: ["trail-dash-turn-left", "trail-dash-turn-right", "trail-dash-jump", "trail-dash-fire"],
  },
  "word-rush": { host: ["host-skip"], player: ["player-text-input", "player-submit"] },
  "block-stack": { host: ["host-skip"], player: ["block-stack-board-touch"] },
  "fleet-duel": { host: ["host-skip"], player: ["fleet-duel-random", "fleet-duel-ready"] },
  "four-in-a-row": { host: ["host-skip"], player: ["four-in-a-row-col-0"] },
  "tic-tac-toe": { host: ["host-skip"], player: ["tic-tac-toe-cell-*"] },
  "hangman-race": { host: ["host-skip"], player: ["hangman-key-e"] },
  "paddle-clash": { host: ["host-skip", "host-pause"], player: ["paddle-move"] },
  "grid-blast": { host: ["host-skip"], player: ["grid-blast-bomb", "grid-blast-up"] },
};

export function allInteractionTestIds(gameId: GameId): string[] {
  const entry = GAME_INTERACTIONS[gameId];
  return [...entry.host, ...entry.player];
}
