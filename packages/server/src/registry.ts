import type { GameModule } from "@party-games/shared";
import { fibbageGame } from "./games/fibbage.js";
import { quiplashGame } from "./games/quiplash.js";
import { quickQuizGame } from "./games/quick-quiz.js";
import { wouldYouRatherGame } from "./games/would-you-rather.js";
import { captionThisGame } from "./games/caption-this.js";
import { drawGuessGame } from "./games/draw-guess.js";
import { bracketBattleGame } from "./games/bracket-battle.js";
import { roleSortGame } from "./games/role-sort.js";
import { timelineGame } from "./games/timeline.js";
import { impostorGame } from "./games/impostor.js";
import { curveFeverGame } from "./games/curve-fever.js";
import { wordRushGame } from "./games/word-rush.js";
import { fibbageReverseGame } from "./games/fibbage-reverse.js";
import { teamCharadesGame } from "./games/team-charades.js";
import { hotSeatGame } from "./games/hot-seat.js";
import { lastOnTheDikeGame } from "./games/last-on-the-dike.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const games: GameModule<any>[] = [
  fibbageGame,
  quiplashGame,
  quickQuizGame,
  wouldYouRatherGame,
  captionThisGame,
  drawGuessGame,
  bracketBattleGame,
  roleSortGame,
  timelineGame,
  impostorGame,
  curveFeverGame,
  wordRushGame,
  fibbageReverseGame,
  teamCharadesGame,
  hotSeatGame,
  lastOnTheDikeGame,
];

export const gameRegistry = new Map(games.map((g) => [g.meta.id, g]));

export function getGame(id: string): GameModule | undefined {
  return gameRegistry.get(id as GameModule["meta"]["id"]);
}

export function listGames(): GameModule["meta"][] {
  return games.map((g) => g.meta);
}
