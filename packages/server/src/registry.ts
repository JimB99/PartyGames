import type { GameModule } from "@party-games/shared";
import { bluffGame } from "./games/bluff.js";
import { promptVoteGame } from "./games/prompt-vote.js";
import { opinionsGame } from "./games/opinions.js";
import { spectrumGame } from "./games/spectrum.js";
import { impostorGame } from "./games/impostor.js";
import { agentGridGame } from "./games/agent-grid.js";
import { bracketBattleGame } from "./games/bracket-battle.js";
import { forbiddenClueGame } from "./games/forbidden-clue.js";
import { teamCharadesGame } from "./games/team-charades.js";
import { lastOnTheDikeGame } from "./games/last-on-the-dike.js";
import { triviaGame } from "./games/trivia.js";
import { drawingGame } from "./games/drawing.js";
import { trailDashGame } from "./games/trail-dash.js";
import { wordRushGame } from "./games/word-rush.js";
import { blockStackGame } from "./games/block-stack.js";
import { gridBlastGame } from "./games/grid-blast.js";
import { paddleClashGame } from "./games/paddle-clash.js";
import { hangmanRaceGame } from "./games/hangman-race.js";
import { fleetDuelGame } from "./games/fleet-duel.js";
import { fourInARowGame } from "./games/four-in-a-row.js";
import { ticTacToeGame } from "./games/tic-tac-toe.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const games: GameModule<any>[] = [
  bluffGame,
  promptVoteGame,
  opinionsGame,
  spectrumGame,
  impostorGame,
  agentGridGame,
  bracketBattleGame,
  forbiddenClueGame,
  teamCharadesGame,
  lastOnTheDikeGame,
  triviaGame,
  drawingGame,
  trailDashGame,
  wordRushGame,
  blockStackGame,
  gridBlastGame,
  paddleClashGame,
  hangmanRaceGame,
  fleetDuelGame,
  fourInARowGame,
  ticTacToeGame,
];

export const gameRegistry = new Map(games.map((g) => [g.meta.id, g]));

export function getGame(id: string): GameModule | undefined {
  return gameRegistry.get(id as GameModule["meta"]["id"]);
}

export function listGames(): GameModule["meta"][] {
  return games.map((g) => g.meta);
}
