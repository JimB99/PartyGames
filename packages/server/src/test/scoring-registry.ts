import type { GameId } from "@party-games/shared";

/** Games with dedicated exact-score tests in *-engine.test.ts files. */
export const SCORING_ENGINE_TEST_FILES: Partial<Record<GameId, string>> = {
  trivia: "trivia-engine.test.ts",
  opinions: "opinions-engine.test.ts",
  "prompt-vote": "prompt-vote-engine.test.ts",
  bluff: "bluff-engine.test.ts",
  drawing: "drawing-game-engine.test.ts",
  impostor: "impostor-game-engine.test.ts",
  "word-rush": "word-rush-engine.test.ts",
  "team-charades": "team-charades.test.ts",
  "paddle-clash": "paddle-clash-engine.test.ts",
};
