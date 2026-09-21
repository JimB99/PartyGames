import type { GameId } from "@party-games/shared";

/** Games with dedicated exact-score tests in *-engine.test.ts files. */
export const SCORING_ENGINE_TEST_FILES: Partial<Record<GameId, string>> = {
  "quick-quiz": "trivia-engine.test.ts",
  timeline: "trivia-engine.test.ts",
  "would-you-rather": "trivia-engine.test.ts",
  "crowd-call": "crowd-call-engine.test.ts",
  "paddle-clash": "paddle-clash-engine.test.ts",
  "word-rush": "word-rush-engine.test.ts",
  "team-charades": "team-charades.test.ts",
  "punchline-battle": "prompt-vote-engine.test.ts",
  "hot-seat": "hot-seat-engine.test.ts",
};
