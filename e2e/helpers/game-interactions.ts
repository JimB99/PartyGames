import type { GameId } from "../../packages/shared/src/constants.ts";

export interface GameInteractions {
  host: string[];
  player: string[];
}

/** Primary interactive controls per game for E2E and audit. Prefix entries end with * for pattern match. */
export const GAME_INTERACTIONS: Record<GameId, GameInteractions> = {
  "fact-check": { host: ["host-skip"], player: ["player-text-input", "player-submit"] },
  "wit-showdown": { host: ["host-skip"], player: ["player-text-input", "player-submit"] },
  "quick-quiz": { host: ["host-skip", "host-extend"], player: ["player-answer-0"] },
  "would-you-rather": { host: ["host-skip"], player: ["wyr-choice-a", "wyr-choice-b"] },
  "draw-guess": { host: ["host-skip"], player: ["draw-canvas", "player-text-input"] },
  "bracket-battle": { host: ["host-skip"], player: ["player-text-input", "player-submit"] },
  "role-sort": { host: ["host-skip"], player: ["role-sort-assign-*", "role-sort-submit"] },
  timeline: { host: ["host-skip"], player: ["timeline-lock-in"] },
  impostor: { host: ["host-skip"], player: ["impostor-accuse-*", "impostor-guess-*"] },
  "trail-dash": { host: ["host-skip"], player: ["trail-dash-turn-left", "trail-dash-turn-right"] },
  "word-rush": { host: ["host-skip"], player: ["player-text-input", "player-submit"] },
  "reverse-fact": { host: ["host-skip"], player: ["player-text-input", "player-submit"] },
  "team-charades": { host: ["host-skip"], player: ["charades-correct"] },
  "hot-seat": { host: ["host-skip"], player: ["player-text-input", "player-submit"] },
  "last-on-the-dike": { host: ["host-skip"], player: ["dike-bid-submit"] },
  "block-stack": { host: ["host-skip"], player: ["block-stack-board-touch"] },
  "fleet-duel": { host: ["host-skip"], player: ["fleet-duel-random", "fleet-duel-ready"] },
  "four-in-a-row": { host: ["host-skip"], player: ["four-in-a-row-col-0"] },
  "tic-tac-toe": { host: ["host-skip"], player: ["tic-tac-toe-cell-*"] },
  "split-the-room": { host: ["host-skip"], player: ["split-vote-a"] },
  spectrum: { host: ["host-skip"], player: ["spectrum-slider", "spectrum-lock-in"] },
  "chain-sketch": { host: ["host-skip"], player: ["draw-canvas"] },
  "crowd-call": { host: ["host-skip"], player: ["crowd-call-option-0"] },
  "star-rate": { host: ["host-skip"], player: ["star-rate-3", "player-text-input"] },
  "agent-grid": { host: ["host-skip"], player: ["agent-grid-tile-0"] },
  "forbidden-clue": { host: ["host-skip"], player: ["forbidden-got-it"] },
  "hangman-race": { host: ["host-skip"], player: ["hangman-key-e"] },
  "paddle-clash": { host: ["host-skip", "host-pause"], player: ["paddle-move"] },
  "grid-blast": { host: ["host-skip"], player: ["grid-blast-bomb", "grid-blast-up"] },
  "draw-vote": { host: ["host-skip"], player: ["draw-canvas"] },
  "draw-impostor": { host: ["host-skip"], player: ["draw-canvas"] },
  "caption-this": { host: ["host-skip"], player: ["player-text-input", "player-submit"] },
};

export function allInteractionTestIds(gameId: GameId): string[] {
  const entry = GAME_INTERACTIONS[gameId];
  return [...entry.host, ...entry.player];
}
